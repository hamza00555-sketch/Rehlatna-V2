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
await db.exec(
  await readFile(
    new URL('../supabase/migrations/202609090004_relations.sql', import.meta.url),
    'utf8',
  ),
);
const owner = '10000000-0000-4000-8000-000000000001',
  planner = '10000000-0000-4000-8000-000000000002',
  supporter = '10000000-0000-4000-8000-000000000003',
  other = '10000000-0000-4000-8000-000000000004';
for (const id of [owner, planner, supporter, other])
  await db.query('insert into auth.users values($1,$2)', [id, id + '@example.test']);
async function as<T>(id: string, fn: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec('set role authenticated');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}
async function rows(sql: string, args: unknown[] = []) {
  return (await db.query(sql, args)).rows as Record<string, unknown>[];
}
const hid = String(
  (
    await as(owner, () =>
      rows(
        "select complete_onboarding('Test','Mother','mother',current_date+120,'جدة','الرياض','',true) id",
      ),
    )
  )[0].id,
);
await db.query(
  "insert into memberships(household_id,user_id,display_name,role,roles) values($1,$2,'Planner','viewer','{finance}'),($1,$3,'Supporter','viewer','{supporter}')",
  [hid, planner, supporter],
);
const item = String(
  (
    await as(owner, () =>
      rows("insert into preparation_items(household_id,title) values($1,'Cot') returning id", [
        hid,
      ]),
    )
  )[0].id,
);
const goal = String(
  (
    await as(planner, () =>
      rows(
        "insert into finance_goals(household_id,owner_id,title,expected_cents,funding_date,item_id) values($1,$2,'Private cot',100000,current_date+90,$3) returning id",
        [hid, planner, item],
      ),
    )
  )[0].id,
);
after(() => db.close());
test('finance-only role sees preparation but cannot read care or edit preparation', async () => {
  await as(owner, () => db.query('select set_rh_negative($1,true)', [hid]));
  assert.equal((await as(planner, () => rows('select * from preparation_items'))).length, 1);
  assert.equal((await as(planner, () => rows('select * from mother_details'))).length, 0);
  await assert.rejects(
    as(planner, () =>
      db.query("insert into appointments(household_id,title,starts_at) values($1,'Hidden',now())", [
        hid,
      ]),
    ),
  );
  assert.equal(
    (
      await as(planner, () =>
        rows("update preparation_items set status='ready' where id=$1 returning id", [item]),
      )
    ).length,
    0,
  );
});
test('private goal owner is protected from family admin and supporter', async () => {
  assert.equal((await as(planner, () => rows('select * from finance_goals'))).length, 1);
  assert.equal((await as(owner, () => rows('select * from finance_goals'))).length, 0);
  assert.equal((await as(supporter, () => rows('select * from finance_goals'))).length, 0);
  assert.equal((await as(supporter, () => rows('select * from mother_details'))).length, 0);
  await assert.rejects(
    as(supporter, () => db.query('select update_finance_settings($1,true,true)', [hid])),
  );
  await assert.rejects(
    as(planner, () => db.query('update finance_goals set owner_id=$1 where id=$2', [owner, goal])),
  );
});
test('goal visibility allows only authorized finance viewers', async () => {
  await as(planner, () =>
    db.query("update finance_goals set visibility='shared' where id=$1", [goal]),
  );
  assert.equal((await as(owner, () => rows('select id from finance_goals'))).length, 1);
  assert.equal((await as(supporter, () => rows('select id from finance_goals'))).length, 0);
  await assert.rejects(
    as(owner, () => db.query("update finance_goals set visibility='private' where id=$1", [goal])),
  );
  await as(planner, () =>
    db.query("update finance_goals set visibility='private' where id=$1", [goal]),
  );
});
test('contributions cannot point across households or use future dates', async () => {
  const otherH = String(
    (
      await as(other, () =>
        rows(
          "select complete_onboarding('Other','Other','partner',current_date+100,'J','J','',true) id",
        ),
      )
    )[0].id,
  );
  await assert.rejects(
    as(planner, () =>
      db.query(
        'insert into finance_contributions(household_id,goal_id,amount_cents,contributed_on) values($1,$2,1000,current_date)',
        [otherH, goal],
      ),
    ),
  );
  await assert.rejects(
    as(planner, () =>
      db.query(
        'insert into finance_contributions(household_id,goal_id,amount_cents,contributed_on) values($1,$2,1000,current_date+1)',
        [hid, goal],
      ),
    ),
  );
  await as(planner, () =>
    db.query(
      'insert into finance_contributions(household_id,goal_id,amount_cents,contributed_on) values($1,$2,1000,current_date)',
      [hid, goal],
    ),
  );
  assert.equal((await as(owner, () => rows('select * from finance_contributions'))).length, 0);
});
test('birth requires explicit authorized RPC and cannot happen twice or in the future', async () => {
  const p = String(
    (await as(owner, () => rows('select id from pregnancies where household_id=$1', [hid])))[0].id,
  );
  await assert.rejects(
    as(owner, () => db.query('update pregnancies set birth_date=current_date where id=$1', [p])),
  );
  await assert.rejects(
    as(supporter, () =>
      db.query("select confirm_birth($1,$2,current_date,null,null,'unknown')", [hid, p]),
    ),
  );
  await assert.rejects(
    as(owner, () =>
      db.query("select confirm_birth($1,$2,current_date+1,null,null,'unknown')", [hid, p]),
    ),
  );
  await as(owner, () =>
    db.query("select confirm_birth($1,$2,current_date,null,'Baby','unknown')", [hid, p]),
  );
  await assert.rejects(
    as(owner, () =>
      db.query("select confirm_birth($1,$2,current_date,null,null,'unknown')", [hid, p]),
    ),
  );
});
test('deleting shared preparation does not reveal or prevent private linked goals', async () => {
  await as(owner, () => db.query('delete from preparation_items where id=$1', [item]));
  assert.equal(
    (await as(planner, () => rows('select item_id from finance_goals where id=$1', [goal])))[0]
      .item_id,
    null,
  );
});

test('provider relationship validation is atomic and blocks foreign hospitals', async () => {
  const value = {
    kind: 'doctor',
    name: 'Test doctor',
    city: 'Riyadh',
    phone: '',
    website: '',
    doctor_role: 'follow',
    specialty: '',
    purposes: [],
    coverage: 'unknown',
    program: '',
    notes: '',
  };
  await assert.rejects(
    as(owner, () =>
      db.query('select save_provider($1,null,$2,$3)', [hid, JSON.stringify(value), [other]]),
    ),
  );
  assert.equal(
    (await as(owner, () => rows("select id from providers where name='Test doctor'"))).length,
    0,
  );
  const result = await as(owner, () =>
    rows('select save_provider($1,null,$2,$3) id', [hid, JSON.stringify(value), []]),
  );
  assert.equal(result.length, 1);
  await assert.rejects(
    as(planner, () =>
      db.query('select save_provider($1,null,$2,$3)', [hid, JSON.stringify(value), []]),
    ),
  );
});
test('contribution audit records the financing effect without revealing it to other members', async () => {
  const audit = await as(planner, () =>
    rows(
      'select before_value,after_value from finance_changes where goal_id=$1 order by changed_at desc',
      [goal],
    ),
  );
  assert(
    audit.some(
      (r) =>
        (r.after_value as Record<string, unknown>)._reason === 'أُضيفت مساهمة جديدة، فقلّ المتبقي.',
    ),
  );
  assert.equal((await as(supporter, () => rows('select * from finance_changes'))).length, 0);
});

test('travel editor preserves completed steps while checkbox can reopen them', async () => {
  await as(owner, () =>
    db.query("select save_care_plan($1,'travel',$2)", [
      hid,
      JSON.stringify({
        travel_from: 'R',
        travel_to: 'M',
        travel_steps: [{ title: 'Tickets', done: false }],
        travel_notes: '',
      }),
    ]),
  );
  await as(owner, () => db.query('select toggle_travel_step($1,0,true)', [hid]));
  await as(owner, () =>
    db.query("select save_care_plan($1,'travel',$2)", [
      hid,
      JSON.stringify({
        travel_from: 'R',
        travel_to: 'M',
        travel_steps: [{ title: 'Tickets', done: false }],
        travel_notes: 'updated',
      }),
    ]),
  );
  const r = await as(owner, () =>
    rows('select travel_steps from care_plans where household_id=$1', [hid]),
  );
  assert.equal((r[0].travel_steps as { done: boolean }[])[0].done, true);
  await as(owner, () => db.query('select toggle_travel_step($1,0,false)', [hid]));
  const reopened = await as(owner, () =>
    rows('select travel_steps from care_plans where household_id=$1', [hid]),
  );
  assert.equal((reopened[0].travel_steps as { done: boolean }[])[0].done, false);
});
