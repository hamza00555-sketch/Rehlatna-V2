import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL policies in an isolated, disposable engine. Never uses a remote project.
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('email',current_setting('request.jwt.claim.email',true))$$;
grant usage on schema public,auth to authenticated,anon;grant execute on all functions in schema auth to authenticated,anon;`);
await db.exec(
  await readFile(
    new URL('../supabase/migrations/202609090001_foundation.sql', import.meta.url),
    'utf8',
  ),
);
await db.exec(`create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets,name text);
create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant select,insert,delete on storage.objects to authenticated;
grant execute on function storage.foldername(text) to authenticated;`);
await db.exec(
  await readFile(
    new URL('../supabase/migrations/202609090002_private_storage.sql', import.meta.url),
    'utf8',
  ),
);
await db.exec(
  await readFile(
    new URL('../supabase/migrations/202609090003_product.sql', import.meta.url),
    'utf8',
  ),
);
const alice = '00000000-0000-4000-8000-000000000001',
  bob = '00000000-0000-4000-8000-000000000002',
  viewer = '00000000-0000-4000-8000-000000000003',
  outsider = '00000000-0000-4000-8000-000000000004';
const emails: Record<string, string> = {
  [alice]: 'alice@example.test',
  [bob]: 'bob@example.test',
  [viewer]: 'viewer@example.test',
  [outsider]: 'outsider@example.test',
};
for (const [id, email] of Object.entries(emails))
  await db.query('insert into auth.users values($1,$2)', [id, email]);
async function as<T>(id: string, work: () => Promise<T>): Promise<T> {
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.email',$2,false)",
    [id, emails[id]],
  );
  await db.exec('set role authenticated');
  try {
    return await work();
  } finally {
    await db.exec('reset role');
  }
}
async function rows(sql: string, args: unknown[] = []) {
  return (await db.query(sql, args)).rows as Record<string, unknown>[];
}
const ha = await as(alice, async () =>
  String((await rows("select public.create_household('Family A','Alice') id"))[0].id),
);
const hb = await as(outsider, async () =>
  String((await rows("select public.create_household('Family B','Outside') id"))[0].id),
);
await db.query(
  "insert into public.memberships(household_id,user_id,display_name,role) values($1,$2,'Bob','editor'),($1,$3,'Supporter','viewer')",
  [ha, bob, viewer],
);
const rid = await as(bob, async () =>
  String(
    (
      await rows(
        "insert into public.private_records(household_id,owner_id,kind,title,amount) values($1,$2,'finance','Private fund',1000) returning id",
        [ha, bob],
      )
    )[0].id,
  ),
);

test('family data is isolated across two households', async () => {
  assert.equal((await as(alice, () => rows('select * from public.households'))).length, 1);
  assert.equal(
    (await as(outsider, () => rows('select * from public.memberships where household_id=$1', [ha])))
      .length,
    0,
  );
  await assert.rejects(
    as(outsider, () =>
      db.query(
        "insert into public.appointments(household_id,title,starts_at) values($1,'Forged',now())",
        [ha],
      ),
    ),
  );
});
test('owner cannot see another member’s private records or grant access to self', async () => {
  assert.equal((await as(alice, () => rows('select * from public.private_records'))).length, 0);
  await assert.rejects(
    as(alice, () =>
      db.query('insert into public.record_shares values($1,$2,$3)', [ha, rid, alice]),
    ),
  );
  assert.equal(
    (
      await as(alice, () =>
        rows("update public.private_records set title='stolen' where id=$1 returning id", [rid]),
      )
    ).length,
    0,
  );
});
test('explicit sharing permits read only and revocation removes access', async () => {
  await as(bob, () =>
    db.query('insert into public.record_shares values($1,$2,$3)', [ha, rid, alice]),
  );
  assert.equal(
    (await as(alice, () => rows('select * from public.private_records where id=$1', [rid]))).length,
    1,
  );
  assert.equal(
    (
      await as(alice, () =>
        rows('update public.private_records set amount=0 where id=$1 returning id', [rid]),
      )
    ).length,
    0,
  );
  await as(bob, () =>
    db.query('delete from public.record_shares where record_id=$1 and recipient_id=$2', [
      rid,
      alice,
    ]),
  );
  assert.equal(
    (await as(alice, () => rows('select * from public.private_records where id=$1', [rid]))).length,
    0,
  );
});
test('a share cannot cross the household boundary', async () => {
  await assert.rejects(
    as(bob, () =>
      db.query('insert into public.record_shares values($1,$2,$3)', [ha, rid, outsider]),
    ),
  );
  await assert.rejects(
    as(bob, () =>
      db.query('insert into public.record_shares values($1,$2,$3)', [hb, rid, outsider]),
    ),
  );
});
test('record ownership and tenant keys cannot be rewritten', async () => {
  await assert.rejects(
    as(bob, () =>
      db.query('update public.private_records set owner_id=$1 where id=$2', [alice, rid]),
    ),
  );
  await assert.rejects(
    as(bob, () =>
      db.query('update public.private_records set household_id=$1 where id=$2', [hb, rid]),
    ),
  );
});
test('private attachment policies bind both the household and uploader', async () => {
  await as(bob, () =>
    db.query("insert into storage.objects(bucket_id,name) values('private-attachments',$1)", [
      ha + '/' + bob + '/scan.webp',
    ]),
  );
  assert.equal((await as(bob, () => rows('select * from storage.objects'))).length, 1);
  assert.equal((await as(alice, () => rows('select * from storage.objects'))).length, 0);
  await assert.rejects(
    as(alice, () =>
      db.query("insert into storage.objects(bucket_id,name) values('private-attachments',$1)", [
        ha + '/' + bob + '/fake.webp',
      ]),
    ),
  );
  await assert.rejects(
    as(outsider, () =>
      db.query("insert into storage.objects(bucket_id,name) values('private-attachments',$1)", [
        ha + '/' + outsider + '/fake.webp',
      ]),
    ),
  );
});
test('only one active pregnancy is permitted and viewer cannot alter its dates', async () => {
  await as(alice, () =>
    db.query("insert into public.pregnancies(household_id,due_date) values($1,'2027-05-01')", [ha]),
  );
  await assert.rejects(
    as(alice, () =>
      db.query("insert into public.pregnancies(household_id,due_date) values($1,'2027-06-01')", [
        ha,
      ]),
    ),
  );
  assert.equal(
    (
      await as(viewer, () =>
        rows(
          "update public.pregnancies set due_date='2027-06-01' where household_id=$1 returning id",
          [ha],
        ),
      )
    ).length,
    0,
  );
});
test('viewer reads shared preparation but cannot write or promote self', async () => {
  await as(alice, () =>
    db.query("insert into public.preparation_items(household_id,title) values($1,'Cot')", [ha]),
  );
  assert.equal((await as(viewer, () => rows('select * from public.preparation_items'))).length, 1);
  await assert.rejects(
    as(viewer, () =>
      db.query("insert into public.preparation_items(household_id,title) values($1,'No')", [ha]),
    ),
  );
  await assert.rejects(
    as(viewer, () =>
      db.query("update public.memberships set role='owner' where user_id=$1", [viewer]),
    ),
  );
  await assert.rejects(
    as(viewer, () =>
      db.query('select public.create_invitation($1,$2,$3,$4)', [
        ha,
        'someone@example.test',
        'editor',
        'a'.repeat(64),
      ]),
    ),
  );
});
test('invitation validates recipient, expiration and one-time claim', async () => {
  const hash = 'b'.repeat(64);
  await as(alice, () =>
    db.query('select public.create_invitation($1,$2,$3,$4)', [ha, emails[bob], 'viewer', hash]),
  );
  await assert.rejects(
    as(outsider, () => db.query('select public.accept_invitation($1,$2)', [hash, 'Outside'])),
  );
  await as(bob, () => db.query('select public.accept_invitation($1,$2)', [hash, 'Bob']));
  await assert.rejects(
    as(bob, () => db.query('select public.accept_invitation($1,$2)', [hash, 'Bob'])),
  );
  assert.equal(
    (
      await rows('select role from public.memberships where household_id=$1 and user_id=$2', [
        ha,
        bob,
      ])
    )[0].role,
    'editor',
  );
  const expired = 'c'.repeat(64);
  await as(alice, () =>
    db.query('select public.create_invitation($1,$2,$3,$4)', [ha, emails[bob], 'editor', expired]),
  );
  await db.query(
    "update private.invitations set expires_at=now()-interval '1 second' where token_hash=$1",
    [expired],
  );
  await assert.rejects(
    as(bob, () => db.query('select public.accept_invitation($1,$2)', [expired, 'Bob'])),
  );
});
test('revoking a member who owns private records blocks all access without handing records to admin', async () => {
  await as(alice, () => db.query('select public.remove_member($1,$2)', [ha, bob]));
  assert.equal((await as(bob, () => rows('select * from public.private_records'))).length, 0);
  assert.equal((await as(bob, () => rows('select * from public.appointments'))).length, 0);
  assert.equal((await as(bob, () => rows('select * from storage.objects'))).length, 0);
  assert.equal((await as(alice, () => rows('select * from public.private_records'))).length, 0);
  assert.equal((await rows('select * from public.private_records where id=$1', [rid])).length, 1);
  await assert.rejects(
    as(alice, () => db.query('select public.remove_member($1,$2)', [ha, alice])),
  );
});
test('anonymous callers cannot create households or read data', async () => {
  await db.exec('set role anon');
  try {
    await assert.rejects(db.query("select public.create_household('X','Y')"));
    await assert.rejects(db.query('select * from public.private_records'));
  } finally {
    await db.exec('reset role');
  }
});
after(async () => {
  await db.close();
});
