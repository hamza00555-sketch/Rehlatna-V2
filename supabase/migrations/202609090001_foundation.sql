-- V2 only. Do not apply to the legacy Rehlatna project.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.households (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 1 and 80),
 created_at timestamptz not null default now()
);
create table public.memberships (
 household_id uuid not null references public.households on delete cascade,
 user_id uuid not null references auth.users on delete cascade,
 display_name text not null check(char_length(display_name) between 1 and 80),
 role text not null check(role in ('owner','editor','viewer')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key(household_id,user_id)
);
create unique index one_household_owner on public.memberships(household_id) where role='owner';
create index memberships_user on public.memberships(user_id);
create table private.invitations (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households on delete cascade,
 email text not null,
 role text not null check(role in ('editor','viewer')),
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz not null default now()+interval '48 hours',
 used_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.pregnancies (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households on delete cascade,
 due_date date not null,
 baby_name text check(char_length(baby_name)<=80),
 birth_date date,
 created_at timestamptz not null default now(),
 unique(household_id,id)
);
create table public.appointments (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households on delete cascade,
 title text not null check(char_length(title) between 1 and 160),
 starts_at timestamptz not null,
 location text check(char_length(location)<=200),
 created_at timestamptz not null default now()
);
create unique index one_active_pregnancy on public.pregnancies(household_id) where birth_date is null;
create table public.preparation_items (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households on delete cascade,
 title text not null check(char_length(title) between 1 and 160),
 status text not null default 'needed' check(status in ('needed','ready','later')),
 created_at timestamptz not null default now()
);
-- Private record ownership is separate from household administration.
create table public.private_records (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households on delete cascade,
 owner_id uuid not null references auth.users,
 kind text not null check(kind in ('medical','finance')),
 title text not null check(char_length(title) between 1 and 160),
 body text not null default '' check(char_length(body)<=5000),
 amount numeric(14,2) check(amount>=0),
 currency text not null default 'SAR' check(currency ~ '^[A-Z]{3}$'),
 created_at timestamptz not null default now(),
 foreign key(household_id,owner_id) references public.memberships(household_id,user_id),
 unique(household_id,id),
 check(kind='finance' or amount is null)
);
create table public.record_shares (
 household_id uuid not null,
 record_id uuid not null,
 recipient_id uuid not null,
 primary key(record_id,recipient_id),
 foreign key(household_id,record_id) references public.private_records(household_id,id) on delete cascade,
 foreign key(household_id,recipient_id) references public.memberships(household_id,user_id) on delete cascade
);
create index records_household on public.private_records(household_id);
create index appointments_household on public.appointments(household_id,starts_at);
create index preparation_household on public.preparation_items(household_id);

create function private.member_role(hid uuid) returns text
language sql stable security definer set search_path='' as $$
 select role from public.memberships where household_id=hid and user_id=(select auth.uid()) and active
$$;
create function private.owns_record(rid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.private_records r where r.id=rid
 and r.owner_id=(select auth.uid()) and private.member_role(r.household_id) is not null)
$$;
create function private.can_read_record(rid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.private_records r where r.id=rid
 and private.member_role(r.household_id) is not null
 and (r.owner_id=(select auth.uid()) or exists(select 1 from public.record_shares s
 where s.record_id=r.id and s.recipient_id=(select auth.uid()))))
$$;
alter table public.households enable row level security;
alter table public.memberships enable row level security;
alter table public.pregnancies enable row level security;
alter table public.appointments enable row level security;
alter table public.preparation_items enable row level security;
alter table public.private_records enable row level security;
alter table public.record_shares enable row level security;
alter table private.invitations enable row level security;

create policy household_read on public.households for select to authenticated using(private.member_role(id) is not null);
create policy members_read on public.memberships for select to authenticated using(private.member_role(household_id) is not null);
create policy pregnancies_read on public.pregnancies for select to authenticated using(private.member_role(household_id) is not null);
create policy pregnancies_write on public.pregnancies for all to authenticated using(private.member_role(household_id) in ('owner','editor')) with check(private.member_role(household_id) in ('owner','editor'));
create policy appointments_read on public.appointments for select to authenticated using(private.member_role(household_id) is not null);
create policy appointments_write on public.appointments for all to authenticated using(private.member_role(household_id) in ('owner','editor')) with check(private.member_role(household_id) in ('owner','editor'));
create policy preparation_read on public.preparation_items for select to authenticated using(private.member_role(household_id) is not null);
create policy preparation_write on public.preparation_items for all to authenticated using(private.member_role(household_id) in ('owner','editor')) with check(private.member_role(household_id) in ('owner','editor'));
create policy records_read on public.private_records for select to authenticated
using(private.member_role(household_id) is not null and (owner_id=(select auth.uid()) or private.can_read_record(id)));
create policy records_insert on public.private_records for insert to authenticated with check(owner_id=(select auth.uid()) and private.member_role(household_id) in ('owner','editor'));
create policy records_update on public.private_records for update to authenticated using(private.owns_record(id)) with check(owner_id=(select auth.uid()) and private.member_role(household_id) is not null);
create policy records_delete on public.private_records for delete to authenticated using(private.owns_record(id));
create policy shares_read on public.record_shares for select to authenticated using(private.owns_record(record_id) or (recipient_id=(select auth.uid()) and private.member_role(household_id) is not null));
create policy shares_insert on public.record_shares for insert to authenticated with check(private.owns_record(record_id));
create policy shares_delete on public.record_shares for delete to authenticated using(private.owns_record(record_id));

-- Limit columns: even owners cannot move rows to another household or change record ownership.
revoke all on public.households,public.memberships,public.pregnancies,public.appointments,public.preparation_items,public.private_records,public.record_shares from anon,authenticated;
grant select on public.households,public.memberships to authenticated;
grant select,insert,delete on public.pregnancies,public.appointments,public.preparation_items,public.private_records,public.record_shares to authenticated;
grant update(due_date,baby_name,birth_date) on public.pregnancies to authenticated;
grant update(title,starts_at,location) on public.appointments to authenticated;
grant update(title,status) on public.preparation_items to authenticated;
grant update(title,body,amount,currency) on public.private_records to authenticated;

create function public.create_household(family_name text,member_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare hid uuid;
begin
 if auth.uid() is null then raise exception 'unauthorized'; end if;
 if (select count(*) from public.memberships where user_id=auth.uid() and role='owner')>=3 then raise exception 'household_limit'; end if;
 insert into public.households(name) values(trim(family_name)) returning id into hid;
 insert into public.memberships(household_id,user_id,display_name,role) values(hid,auth.uid(),trim(member_name),'owner');
 return hid;
end $$;
create function public.create_invitation(hid uuid,recipient_email text,invite_role text,hash text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if private.member_role(hid) is distinct from 'owner' then raise exception 'forbidden'; end if;
 if recipient_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(recipient_email)>254 then raise exception 'invalid_email'; end if;
 if (select count(*) from private.invitations where household_id=hid and created_at>now()-interval '1 day')>=20 then raise exception 'invite_limit'; end if;
 insert into private.invitations(household_id,email,role,token_hash) values(hid,lower(trim(recipient_email)),invite_role,hash);
end $$;
create function public.accept_invitation(hash text,member_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare invitation private.invitations;
begin
 if auth.uid() is null then raise exception 'unauthorized'; end if;
 select * into invitation from private.invitations where token_hash=hash for update;
 if invitation.id is null or invitation.used_at is not null or invitation.expires_at<=now()
 or invitation.email is distinct from lower(auth.jwt()->>'email') then raise exception 'invalid_invitation'; end if;
 insert into public.memberships(household_id,user_id,display_name,role)
 values(invitation.household_id,auth.uid(),trim(member_name),invitation.role)
 on conflict(household_id,user_id) do update set active=true, role=excluded.role
 where not public.memberships.active;
 update private.invitations set used_at=now() where id=invitation.id;
 return invitation.household_id;
end $$;
create function public.remove_member(hid uuid,uid uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if private.member_role(hid) is distinct from 'owner' or uid=auth.uid() then raise exception 'forbidden'; end if;
 -- Revoke immediately without deleting or transferring the member's private records.
 delete from public.record_shares where household_id=hid and recipient_id=uid;
 update public.memberships set active=false where household_id=hid and user_id=uid;
end $$;
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.member_role(uuid),private.owns_record(uuid),private.can_read_record(uuid) to authenticated;
revoke all on function public.create_household(text,text),public.create_invitation(uuid,text,text,text),public.accept_invitation(text,text),public.remove_member(uuid,uuid) from public,anon;
grant execute on function public.create_household(text,text),public.create_invitation(uuid,text,text,text),public.accept_invitation(text,text),public.remove_member(uuid,uuid) to authenticated;
commit;
