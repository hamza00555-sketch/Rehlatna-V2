-- Additive V2 product schema. Apply after 001 and 002, once only.
begin;
alter table public.households add column follow_city text not null default '' check(length(follow_city)<=100), add column birth_city text not null default '' check(length(birth_city)<=100), add column currency text not null default 'SAR' check(currency ~ '^[A-Z]{3}$'), add column partner_name text not null default '' check(length(partner_name)<=80);
alter table public.memberships add column roles text[] not null default '{}', add column permission_overrides jsonb not null default '{}' check(jsonb_typeof(permission_overrides)='object');
alter table public.memberships add constraint member_roles_known check(roles <@ array['mother','partner','finance','supporter']::text[]);
create function private.role_permissions(member_roles text[], legacy_role text default null) returns text[] language sql immutable set search_path='' as $$
 select array(select distinct p from unnest(case when cardinality(member_roles)=0 then case when legacy_role in ('owner','editor') then array['partner'] else array['supporter'] end else member_roles end) r cross join lateral unnest(case r
 when 'mother' then array['journey.view','journey.edit','appointments.view','appointments.edit','preparation.view','preparation.edit','care.view','care.edit','family.manage']
 when 'partner' then array['journey.view','journey.edit','appointments.view','appointments.edit','preparation.view','preparation.edit','care.view','care.edit','family.manage']
 when 'finance' then array['preparation.view','finance.view','finance.edit']
 when 'supporter' then array['journey.view','appointments.view','preparation.view'] else '{}'::text[] end) p)
$$;
create function private.has_permission(hid uuid, permission text) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select case when permission_overrides ? permission then (permission_overrides->>permission)::boolean else permission=any(private.role_permissions(roles,role)) end from public.memberships where household_id=hid and user_id=auth.uid() and active),false)
$$;
create function private.valid_overrides(value jsonb) returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(value)='object' and not exists(select 1 from jsonb_each(value) where key<>all(array['journey.view','journey.edit','appointments.view','appointments.edit','preparation.view','preparation.edit','care.view','care.edit','finance.view','finance.edit','family.manage']) or jsonb_typeof(value)<>'boolean')
$$;
alter table public.memberships add constraint permission_overrides_known check(private.valid_overrides(permission_overrides));

alter table public.pregnancies add column sex text not null default 'unknown' check(sex in ('unknown','female','male','undisclosed')), add column birth_time time, add column due_updated_at timestamptz;
create table public.due_date_history(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,pregnancy_id uuid not null,old_date date not null,new_date date not null,changed_at timestamptz not null default now(),foreign key(household_id,pregnancy_id) references public.pregnancies(household_id,id) on delete cascade);
create function private.track_due_date() returns trigger language plpgsql security definer set search_path='' as $$ begin if new.due_date is distinct from old.due_date then new.due_updated_at=now();insert into public.due_date_history(household_id,pregnancy_id,old_date,new_date) values(new.household_id,new.id,old.due_date,new.due_date);end if;return new;end $$;
create trigger pregnancy_due_audit before update of due_date on public.pregnancies for each row execute function private.track_due_date();
create table public.mother_details(household_id uuid primary key references public.households on delete cascade,rh_negative boolean not null default false);

alter table public.preparation_items drop constraint preparation_items_status_check;
alter table public.preparation_items add constraint preparation_items_status_check check(status in ('needed','ready','later','not_required'));
alter table public.preparation_items alter column status set default 'later';
alter table public.preparation_items add column category text not null default 'other' check(category in ('sleep','transport','feeding','clothes','care','hospital','travel','mother','other')), add column item_type text not null default 'small' check(item_type in ('large','small')),add column hospital_bag boolean not null default false,add column notes text not null default '' check(length(notes)<=5000);
alter table public.preparation_items add unique(household_id,id);
create table public.providers(
 id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,
 kind text not null check(kind in ('doctor','hospital','insurance')), name text not null check(length(name) between 1 and 120),
 city text not null default '' check(length(city)<=100),phone text not null default '' check(length(phone)<=40),website text not null default '' check(length(website)<=500),
 doctor_role text not null default 'follow' check(doctor_role in ('follow','birth','consultant','backup')),specialty text not null default '' check(length(specialty)<=120),
 purposes text[] not null default '{birth}' check(purposes <@ array['follow','birth','emergency']::text[]),
 coverage text not null default 'unknown' check(coverage in ('unknown','believed_included','believed_excluded')),last_verified date,
 program text not null default '' check(length(program)<=120),notes text not null default '' check(length(notes)<=5000),created_at timestamptz not null default now(),unique(household_id,id)
);
create table public.provider_links(household_id uuid not null,parent_id uuid not null,child_id uuid not null,primary key(parent_id,child_id),check(parent_id<>child_id),foreign key(household_id,parent_id) references public.providers(household_id,id) on delete cascade,foreign key(household_id,child_id) references public.providers(household_id,id) on delete cascade);
create table public.verification_tasks(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,provider_id uuid not null,title text not null check(length(title) between 1 and 160),done boolean not null default false,created_at timestamptz not null default now(),foreign key(household_id,provider_id) references public.providers(household_id,id) on delete cascade);

alter table public.appointments add column kind text not null default 'follow' check(kind in ('follow','ultrasound','lab','consultation','birth_plan','postpartum','baby','other')),add column status text not null default 'upcoming' check(status in ('upcoming','completed','cancelled')),add column city text not null default '' check(length(city)<=100),add column doctor_id uuid,add column hospital_id uuid,add column window_key text check(length(window_key)<=80),add column notes text not null default '' check(length(notes)<=5000),add column steps jsonb not null default '[]' check(jsonb_typeof(steps)='array' and jsonb_array_length(steps)<=40),add column reminder boolean not null default true,add column has_time boolean not null default true;
alter table public.appointments add unique(household_id,id),add foreign key(household_id,doctor_id) references public.providers(household_id,id),add foreign key(household_id,hospital_id) references public.providers(household_id,id);
create table public.milestones(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,title text not null check(length(title) between 1 and 160),event_date date not null,kind text not null default 'family' check(kind in ('manual','family','travel','preparation','medical')),description text not null default '' check(length(description)<=5000),created_at timestamptz not null default now());
create table public.ultrasounds(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,appointment_id uuid,scan_date date not null,week integer check(week between 0 and 44),notes text not null default '' check(length(notes)<=5000),foreign key(household_id,appointment_id) references public.appointments(household_id,id) on delete cascade);
create table public.care_registrations(household_id uuid not null references public.households on delete cascade,window_key text not null check(length(window_key)<=80),status text not null check(status in ('done','discussed','not_applicable')),recorded_at timestamptz not null default now(),primary key(household_id,window_key));
create table public.care_plans(
 household_id uuid primary key references public.households on delete cascade,
 hospital_id uuid,doctor_id uuid,insurance_id uuid,support text not null default '' check(length(support)<=300),preferences text not null default '' check(length(preferences)<=5000),
 travel_from text not null default '' check(length(travel_from)<=100),travel_to text not null default '' check(length(travel_to)<=100),move_date date,return_date date,travel_steps jsonb not null default '[]' check(jsonb_typeof(travel_steps)='array' and jsonb_array_length(travel_steps)<=40),travel_notes text not null default '' check(length(travel_notes)<=5000),
 feeding text[] not null default '{}' check(feeding <@ array['breast','expressed','formula']::text[]),feeding_notes text not null default '' check(length(feeding_notes)<=5000),
 foreign key(household_id,hospital_id) references public.providers(household_id,id),foreign key(household_id,doctor_id) references public.providers(household_id,id),foreign key(household_id,insurance_id) references public.providers(household_id,id),check(return_date is null or move_date is null or return_date>=move_date)
);
create table public.postpartum_tasks(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,title text not null check(length(title) between 1 and 160),kind text not null default 'other' check(kind in ('feeding','medical','mother','home','other')),task_date date,done boolean not null default false,created_at timestamptz not null default now());
create table public.member_preferences(user_id uuid primary key references auth.users on delete cascade,theme text not null default 'system' check(theme in ('system','light','dark')),reduce_motion boolean not null default false);

-- Finance lives in separate tables and policies; nothing is joined into preparation for unauthorized members.
create table public.finance_settings(household_id uuid primary key references public.households on delete cascade,owner_id uuid not null references auth.users,enabled boolean not null default false,shared boolean not null default false,foreign key(household_id,owner_id) references public.memberships(household_id,user_id));
create table public.finance_goals(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,owner_id uuid not null references auth.users,title text not null check(length(title) between 1 and 160),expected_cents bigint not null check(expected_cents between 0 and 999999999999),actual_cents bigint check(actual_cents between 0 and 999999999999),initial_cents bigint not null default 0 check(initial_cents between 0 and 999999999999),funding_date date not null,spending_date date,priority text not null default 'important' check(priority in ('essential','important','optional')),stage text not null default 'before' check(stage in ('before','birth','after')),visibility text not null default 'private' check(visibility in ('private','shared')),notes text not null default '' check(length(notes)<=5000),item_id uuid,created_at timestamptz not null default now(),foreign key(household_id,owner_id) references public.memberships(household_id,user_id),foreign key(household_id,item_id) references public.preparation_items(household_id,id) on delete set null(item_id),unique(household_id,id));
create table public.finance_contributions(id uuid primary key default gen_random_uuid(),household_id uuid not null,goal_id uuid not null,amount_cents bigint not null check(amount_cents between 1 and 999999999999),contributed_on date not null check(contributed_on<=current_date),note text not null default '' check(length(note)<=1000),created_by uuid not null default auth.uid() references auth.users,created_at timestamptz not null default now(),foreign key(household_id,goal_id) references public.finance_goals(household_id,id) on delete cascade);
create table public.finance_changes(id uuid primary key default gen_random_uuid(),household_id uuid not null,goal_id uuid not null,before_value jsonb not null,after_value jsonb not null,changed_at timestamptz not null default now(),foreign key(household_id,goal_id) references public.finance_goals(household_id,id) on delete cascade);
create function private.finance_enabled(hid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.finance_settings where household_id=hid and enabled)$$;
create function private.finance_owner(hid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.finance_settings where household_id=hid and owner_id=auth.uid()) and private.member_role(hid) is not null$$;
create function private.goal_visible(hid uuid,oid uuid,visibility text) returns boolean language sql stable security definer set search_path='' as $$
 select private.has_permission(hid,'finance.view') and exists(select 1 from public.finance_settings where household_id=hid and enabled and (oid=auth.uid() or visibility='shared' or shared))
$$;
create function private.can_read_goal(gid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.finance_goals g join public.finance_settings f on f.household_id=g.household_id where g.id=gid and f.enabled and private.has_permission(g.household_id,'finance.view') and (g.owner_id=auth.uid() or g.visibility='shared' or f.shared))
$$;
create function private.finance_change_audit() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.finance_changes(household_id,goal_id,before_value,after_value) values(new.household_id,new.id,to_jsonb(old),to_jsonb(new));return new;end $$;
create trigger goal_audit after update on public.finance_goals for each row when(old is distinct from new) execute function private.finance_change_audit();

-- Granular policies replace the broad legacy policies for shared content only.
drop policy pregnancies_read on public.pregnancies;drop policy pregnancies_write on public.pregnancies;
create policy pregnancies_read on public.pregnancies for select to authenticated using(private.has_permission(household_id,'journey.view') or private.has_permission(household_id,'preparation.view'));
create policy pregnancies_insert on public.pregnancies for insert to authenticated with check(private.has_permission(household_id,'journey.edit'));
create policy pregnancies_update on public.pregnancies for update to authenticated using(private.has_permission(household_id,'journey.edit')) with check(private.has_permission(household_id,'journey.edit'));
create policy pregnancies_delete on public.pregnancies for delete to authenticated using(private.has_permission(household_id,'journey.edit'));
drop policy appointments_read on public.appointments;drop policy appointments_write on public.appointments;
drop policy preparation_read on public.preparation_items;drop policy preparation_write on public.preparation_items;
alter table public.appointments enable row level security;
revoke all on public.appointments from anon,authenticated;
grant select,insert,delete on public.appointments to authenticated;
create policy appointments_read on public.appointments for select to authenticated using(private.has_permission(household_id,'appointments.view'));
create policy appointments_insert on public.appointments for insert to authenticated with check(private.has_permission(household_id,'appointments.edit'));
create policy appointments_update on public.appointments for update to authenticated using(private.has_permission(household_id,'appointments.edit')) with check(private.has_permission(household_id,'appointments.edit'));
create policy appointments_delete on public.appointments for delete to authenticated using(private.has_permission(household_id,'appointments.edit'));
grant update(title,starts_at,location,kind,status,city,doctor_id,hospital_id,window_key,notes,steps,reminder,has_time) on public.appointments to authenticated;
alter table public.preparation_items enable row level security;
revoke all on public.preparation_items from anon,authenticated;
grant select,insert,delete on public.preparation_items to authenticated;
create policy preparation_items_read on public.preparation_items for select to authenticated using(private.has_permission(household_id,'preparation.view'));
create policy preparation_items_insert on public.preparation_items for insert to authenticated with check(private.has_permission(household_id,'preparation.edit'));
create policy preparation_items_update on public.preparation_items for update to authenticated using(private.has_permission(household_id,'preparation.edit')) with check(private.has_permission(household_id,'preparation.edit'));
create policy preparation_items_delete on public.preparation_items for delete to authenticated using(private.has_permission(household_id,'preparation.edit'));
grant update(title,status,category,item_type,hospital_bag,notes) on public.preparation_items to authenticated;
alter table public.providers enable row level security;
revoke all on public.providers from anon,authenticated;
grant select,insert,delete on public.providers to authenticated;
create policy providers_read on public.providers for select to authenticated using(private.has_permission(household_id,'care.view'));
create policy providers_insert on public.providers for insert to authenticated with check(private.has_permission(household_id,'care.edit'));
create policy providers_update on public.providers for update to authenticated using(private.has_permission(household_id,'care.edit')) with check(private.has_permission(household_id,'care.edit'));
create policy providers_delete on public.providers for delete to authenticated using(private.has_permission(household_id,'care.edit'));
grant update(name,city,phone,website,doctor_role,specialty,purposes,coverage,last_verified,program,notes) on public.providers to authenticated;
alter table public.provider_links enable row level security;
revoke all on public.provider_links from anon,authenticated;
grant select,insert,delete on public.provider_links to authenticated;
create policy provider_links_read on public.provider_links for select to authenticated using(private.has_permission(household_id,'care.view'));
create policy provider_links_insert on public.provider_links for insert to authenticated with check(private.has_permission(household_id,'care.edit'));
create policy provider_links_update on public.provider_links for update to authenticated using(private.has_permission(household_id,'care.edit')) with check(private.has_permission(household_id,'care.edit'));
create policy provider_links_delete on public.provider_links for delete to authenticated using(private.has_permission(household_id,'care.edit'));
alter table public.verification_tasks enable row level security;
revoke all on public.verification_tasks from anon,authenticated;
grant select,insert,delete on public.verification_tasks to authenticated;
create policy verification_tasks_read on public.verification_tasks for select to authenticated using(private.has_permission(household_id,'care.view'));
create policy verification_tasks_insert on public.verification_tasks for insert to authenticated with check(private.has_permission(household_id,'care.edit'));
create policy verification_tasks_update on public.verification_tasks for update to authenticated using(private.has_permission(household_id,'care.edit')) with check(private.has_permission(household_id,'care.edit'));
create policy verification_tasks_delete on public.verification_tasks for delete to authenticated using(private.has_permission(household_id,'care.edit'));
grant update(title,done) on public.verification_tasks to authenticated;
alter table public.milestones enable row level security;
revoke all on public.milestones from anon,authenticated;
grant select,insert,delete on public.milestones to authenticated;
create policy milestones_read on public.milestones for select to authenticated using(private.has_permission(household_id,'journey.view'));
create policy milestones_insert on public.milestones for insert to authenticated with check(private.has_permission(household_id,'journey.edit'));
create policy milestones_update on public.milestones for update to authenticated using(private.has_permission(household_id,'journey.edit')) with check(private.has_permission(household_id,'journey.edit'));
create policy milestones_delete on public.milestones for delete to authenticated using(private.has_permission(household_id,'journey.edit'));
grant update(title,event_date,kind,description) on public.milestones to authenticated;
alter table public.ultrasounds enable row level security;
revoke all on public.ultrasounds from anon,authenticated;
grant select,insert,delete on public.ultrasounds to authenticated;
create policy ultrasounds_read on public.ultrasounds for select to authenticated using(private.has_permission(household_id,'appointments.view'));
create policy ultrasounds_insert on public.ultrasounds for insert to authenticated with check(private.has_permission(household_id,'appointments.edit'));
create policy ultrasounds_update on public.ultrasounds for update to authenticated using(private.has_permission(household_id,'appointments.edit')) with check(private.has_permission(household_id,'appointments.edit'));
create policy ultrasounds_delete on public.ultrasounds for delete to authenticated using(private.has_permission(household_id,'appointments.edit'));
grant update(scan_date,week,notes) on public.ultrasounds to authenticated;
alter table public.care_registrations enable row level security;
revoke all on public.care_registrations from anon,authenticated;
grant select,insert,delete on public.care_registrations to authenticated;
create policy care_registrations_read on public.care_registrations for select to authenticated using(private.has_permission(household_id,'appointments.view'));
create policy care_registrations_insert on public.care_registrations for insert to authenticated with check(private.has_permission(household_id,'appointments.edit'));
create policy care_registrations_update on public.care_registrations for update to authenticated using(private.has_permission(household_id,'appointments.edit')) with check(private.has_permission(household_id,'appointments.edit'));
create policy care_registrations_delete on public.care_registrations for delete to authenticated using(private.has_permission(household_id,'appointments.edit'));
grant update(status,recorded_at) on public.care_registrations to authenticated;
alter table public.care_plans enable row level security;
revoke all on public.care_plans from anon,authenticated;
grant select,insert,delete on public.care_plans to authenticated;
create policy care_plans_read on public.care_plans for select to authenticated using(private.has_permission(household_id,'care.view'));
create policy care_plans_insert on public.care_plans for insert to authenticated with check(private.has_permission(household_id,'care.edit'));
create policy care_plans_update on public.care_plans for update to authenticated using(private.has_permission(household_id,'care.edit')) with check(private.has_permission(household_id,'care.edit'));
create policy care_plans_delete on public.care_plans for delete to authenticated using(private.has_permission(household_id,'care.edit'));
grant update(hospital_id,doctor_id,insurance_id,support,preferences,travel_from,travel_to,move_date,return_date,travel_steps,travel_notes,feeding,feeding_notes) on public.care_plans to authenticated;
alter table public.postpartum_tasks enable row level security;
revoke all on public.postpartum_tasks from anon,authenticated;
grant select,insert,delete on public.postpartum_tasks to authenticated;
create policy postpartum_tasks_read on public.postpartum_tasks for select to authenticated using(private.has_permission(household_id,'care.view'));
create policy postpartum_tasks_insert on public.postpartum_tasks for insert to authenticated with check(private.has_permission(household_id,'care.edit'));
create policy postpartum_tasks_update on public.postpartum_tasks for update to authenticated using(private.has_permission(household_id,'care.edit')) with check(private.has_permission(household_id,'care.edit'));
create policy postpartum_tasks_delete on public.postpartum_tasks for delete to authenticated using(private.has_permission(household_id,'care.edit'));
grant update(title,kind,task_date,done) on public.postpartum_tasks to authenticated;
alter table public.mother_details enable row level security;
revoke all on public.mother_details from anon,authenticated;
grant select,insert,delete on public.mother_details to authenticated;
create policy mother_details_read on public.mother_details for select to authenticated using(private.has_permission(household_id,'care.view'));
create policy mother_details_insert on public.mother_details for insert to authenticated with check(private.has_permission(household_id,'care.edit'));
create policy mother_details_update on public.mother_details for update to authenticated using(private.has_permission(household_id,'care.edit')) with check(private.has_permission(household_id,'care.edit'));
create policy mother_details_delete on public.mother_details for delete to authenticated using(private.has_permission(household_id,'care.edit'));
grant update(rh_negative) on public.mother_details to authenticated;
alter table public.due_date_history enable row level security;
revoke all on public.due_date_history from anon,authenticated;grant select on public.due_date_history to authenticated;
create policy history_read on public.due_date_history for select to authenticated using(private.has_permission(household_id,'journey.view'));
alter table public.member_preferences enable row level security;
revoke all on public.member_preferences from anon,authenticated;grant select,insert on public.member_preferences to authenticated;grant update(theme,reduce_motion) on public.member_preferences to authenticated;
create policy preference_owner on public.member_preferences for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table public.finance_settings enable row level security;
alter table public.finance_goals enable row level security;
alter table public.finance_contributions enable row level security;
alter table public.finance_changes enable row level security;
revoke all on public.finance_settings,public.finance_goals,public.finance_contributions,public.finance_changes from anon,authenticated;
grant select on public.finance_settings,public.finance_changes to authenticated;
grant select,insert,delete on public.finance_goals,public.finance_contributions to authenticated;
grant update(title,expected_cents,actual_cents,initial_cents,funding_date,spending_date,priority,stage,visibility,notes) on public.finance_goals to authenticated;
create policy finance_settings_read on public.finance_settings for select to authenticated using(private.has_permission(household_id,'finance.view') or private.finance_owner(household_id));
create policy goals_read on public.finance_goals for select to authenticated using(private.goal_visible(household_id,owner_id,visibility));
create policy goals_insert on public.finance_goals for insert to authenticated with check(owner_id=auth.uid() and private.has_permission(household_id,'finance.edit') and private.has_permission(household_id,'finance.view') and private.finance_enabled(household_id));
create policy goals_update on public.finance_goals for update to authenticated using(private.goal_visible(household_id,owner_id,visibility) and private.has_permission(household_id,'finance.edit')) with check(private.goal_visible(household_id,owner_id,visibility) and private.has_permission(household_id,'finance.edit'));
create policy goals_delete on public.finance_goals for delete to authenticated using(private.can_read_goal(id) and private.has_permission(household_id,'finance.edit'));
create policy contribution_read on public.finance_contributions for select to authenticated using(private.can_read_goal(goal_id));
create policy contribution_insert on public.finance_contributions for insert to authenticated with check(created_by=auth.uid() and private.can_read_goal(goal_id) and private.has_permission(household_id,'finance.edit'));
create policy contribution_delete on public.finance_contributions for delete to authenticated using(private.can_read_goal(goal_id) and private.has_permission(household_id,'finance.edit'));
create policy changes_read on public.finance_changes for select to authenticated using(private.can_read_goal(goal_id));
grant update(sex,birth_time) on public.pregnancies to authenticated;
-- RPCs validate privilege changes; raw member/household/finance-setting updates remain prohibited.
create function public.update_member_permissions(hid uuid,uid uuid,new_roles text[],overrides jsonb) returns void language plpgsql security definer set search_path='' as $$
declare previous public.memberships; new_finance boolean; old_finance boolean;
begin
 if not private.has_permission(hid,'family.manage') then raise exception 'forbidden';end if;
 select * into previous from public.memberships where household_id=hid and user_id=uid and active for update;
 if previous.user_id is null or cardinality(new_roles)=0 or not private.valid_overrides(overrides) then raise exception 'invalid_member';end if;
 if uid=auth.uid() and not coalesce((overrides->>'family.manage')::boolean,'family.manage'=any(private.role_permissions(new_roles))) then raise exception 'cannot_remove_own_management';end if;
 old_finance=coalesce((previous.permission_overrides->>'finance.view')::boolean,'finance.view'=any(private.role_permissions(previous.roles,previous.role))) or coalesce((previous.permission_overrides->>'finance.edit')::boolean,'finance.edit'=any(private.role_permissions(previous.roles,previous.role)));
 new_finance=coalesce((overrides->>'finance.view')::boolean,'finance.view'=any(private.role_permissions(new_roles))) or coalesce((overrides->>'finance.edit')::boolean,'finance.edit'=any(private.role_permissions(new_roles)));
 if (old_finance is distinct from new_finance or previous.permission_overrides->'finance.view' is distinct from overrides->'finance.view' or previous.permission_overrides->'finance.edit' is distinct from overrides->'finance.edit') and not private.finance_owner(hid) then raise exception 'finance_owner_required';end if;
 update public.memberships set roles=new_roles,permission_overrides=overrides where household_id=hid and user_id=uid;
end $$;
create function public.update_household_profile(hid uuid,new_name text,follow_city text,birth_city text,currency text) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.has_permission(hid,'family.manage') then raise exception 'forbidden';end if;
 update public.households set name=trim(new_name),follow_city=trim(update_household_profile.follow_city),birth_city=trim(update_household_profile.birth_city),currency=upper(update_household_profile.currency) where id=hid;
end $$;
create function public.update_finance_settings(hid uuid,is_enabled boolean,is_shared boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.finance_owner(hid) then raise exception 'finance_owner_required';end if;
 update public.finance_settings set enabled=is_enabled,shared=is_shared where household_id=hid;
end $$;
create function public.complete_onboarding(family_name text,member_name text,member_role text,due_date date,follow_city text,birth_city text,partner_name text,finance_enabled boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare hid uuid; chosen_roles text[];
begin
 if auth.uid() is null or member_role not in ('mother','partner','supporter') or due_date<current_date or due_date>current_date+294 or length(trim(follow_city))=0 or length(trim(birth_city))=0 then raise exception 'invalid_setup';end if;
 hid=public.create_household(family_name,member_name);
 chosen_roles=array[member_role];if finance_enabled then chosen_roles=array_append(chosen_roles,'finance');end if;
 update public.memberships set roles=chosen_roles,permission_overrides=jsonb_build_object('family.manage',true) where household_id=hid and user_id=auth.uid();
 update public.households set follow_city=trim(complete_onboarding.follow_city),birth_city=trim(complete_onboarding.birth_city),partner_name=trim(complete_onboarding.partner_name) where id=hid;
 insert into public.pregnancies(household_id,due_date) values(hid,complete_onboarding.due_date);
 insert into public.finance_settings(household_id,owner_id,enabled) values(hid,auth.uid(),finance_enabled);
 insert into public.care_plans(household_id,travel_from,travel_to) values(hid,trim(follow_city),trim(birth_city));
 return hid;
end $$;
create function public.initialize_finance(hid uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.has_permission(hid,'family.manage') then raise exception 'forbidden';end if;
 insert into public.finance_settings(household_id,owner_id) values(hid,auth.uid()) on conflict(household_id) do nothing;
 if not private.finance_owner(hid) then raise exception 'finance_owner_required';end if;
 update public.memberships set roles=case when 'finance'=any(roles) then roles else array_append(case when cardinality(roles)=0 then array['partner'] else roles end,'finance') end,permission_overrides=permission_overrides-'finance.view'-'finance.edit' where household_id=hid and user_id=auth.uid();
end $$;
create function public.delete_household(hid uuid,confirmation text) returns void language plpgsql security definer set search_path='' as $$begin
 if private.member_role(hid) is distinct from 'owner' or confirmation<>'DELETE' then raise exception 'forbidden';end if;
 delete from public.households where id=hid;
end $$;
-- Prevent own/foreign identifiers being altered by any write path.
create function private.protect_goal_identity() returns trigger language plpgsql set search_path='' as $$begin
 if new.owner_id<>old.owner_id or new.household_id<>old.household_id or (new.item_id is distinct from old.item_id and new.item_id is not null) then raise exception 'immutable_goal_identity';end if;
 if new.visibility<>old.visibility and old.owner_id<>auth.uid() then raise exception 'goal_owner_required';end if;
 return new;
end $$;
create trigger goal_identity before update on public.finance_goals for each row execute function private.protect_goal_identity();
revoke all on function private.role_permissions(text[],text),private.has_permission(uuid,text),private.valid_overrides(jsonb),private.track_due_date(),private.finance_enabled(uuid),private.finance_owner(uuid),private.can_read_goal(uuid),private.finance_change_audit(),private.protect_goal_identity() from public,anon,authenticated;
grant execute on function private.has_permission(uuid,text),private.valid_overrides(jsonb),private.finance_enabled(uuid),private.finance_owner(uuid),private.can_read_goal(uuid) to authenticated;
revoke all on function public.update_member_permissions(uuid,uuid,text[],jsonb),public.update_household_profile(uuid,text,text,text,text),public.update_finance_settings(uuid,boolean,boolean),public.complete_onboarding(text,text,text,date,text,text,text,boolean),public.initialize_finance(uuid),public.delete_household(uuid,text) from public,anon;
grant execute on function public.update_member_permissions(uuid,uuid,text[],jsonb),public.update_household_profile(uuid,text,text,text,text),public.update_finance_settings(uuid,boolean,boolean),public.complete_onboarding(text,text,text,date,text,text,text,boolean),public.initialize_finance(uuid),public.delete_household(uuid,text) to authenticated;
create index providers_household on public.providers(household_id,kind);
create index milestones_household on public.milestones(household_id,event_date);
create index finance_goals_household on public.finance_goals(household_id);
create index finance_contributions_goal on public.finance_contributions(goal_id);
create index postpartum_tasks_household on public.postpartum_tasks(household_id,task_date);
create function public.set_appointment_status(hid uuid,aid uuid,new_status text) returns void language plpgsql security definer set search_path='' as $$declare a public.appointments;begin
 if not private.has_permission(hid,'appointments.edit') or new_status not in ('completed','cancelled') then raise exception 'forbidden';end if;
 select * into a from public.appointments where id=aid and household_id=hid for update;if a.id is null then raise exception 'not_found';end if;
 update public.appointments set status=new_status where id=aid;
 if new_status='completed' and a.window_key is not null then insert into public.care_registrations(household_id,window_key,status) values(hid,a.window_key,'done') on conflict(household_id,window_key) do nothing;end if;
end $$;
create function public.toggle_appointment_step(hid uuid,aid uuid,step_index integer,is_done boolean) returns void language plpgsql security definer set search_path='' as $$declare a public.appointments;begin
 if not private.has_permission(hid,'appointments.edit') then raise exception 'forbidden';end if;
 select * into a from public.appointments where id=aid and household_id=hid for update;if a.id is null or step_index<0 or step_index>=jsonb_array_length(a.steps) then raise exception 'invalid_step';end if;
 update public.appointments set steps=jsonb_set(a.steps,array[step_index::text,'done'],to_jsonb(is_done)) where id=aid;
end $$;
create function public.save_care_plan(hid uuid,section text,value jsonb) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.has_permission(hid,'care.edit') then raise exception 'forbidden';end if;
 insert into public.care_plans(household_id) values(hid) on conflict(household_id) do nothing;
 if section='birth' then
 update public.care_plans set hospital_id=(value->>'hospital_id')::uuid,doctor_id=(value->>'doctor_id')::uuid,insurance_id=(value->>'insurance_id')::uuid,support=coalesce(value->>'support',''),preferences=coalesce(value->>'preferences','') where household_id=hid;
 elsif section='travel' then
 update public.care_plans set travel_from=value->>'travel_from',travel_to=value->>'travel_to',move_date=(value->>'move_date')::date,return_date=(value->>'return_date')::date,travel_steps=coalesce(value->'travel_steps','[]'),travel_notes=coalesce(value->>'travel_notes','') where household_id=hid;
 elsif section='feeding' then
 update public.care_plans set feeding=array(select jsonb_array_elements_text(value->'feeding')),feeding_notes=coalesce(value->>'feeding_notes','') where household_id=hid;
 else raise exception 'invalid_section';end if;
end $$;
create function public.set_rh_negative(hid uuid,value boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.has_permission(hid,'care.edit') then raise exception 'forbidden';end if;
 insert into public.mother_details(household_id,rh_negative) values(hid,value) on conflict(household_id) do update set rh_negative=excluded.rh_negative;
end $$;
create function public.confirm_birth(hid uuid,pid uuid,born_on date,born_at time,child_name text,child_sex text) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.has_permission(hid,'journey.edit') or born_on is null or born_on>current_date or born_on<current_date-366 then raise exception 'invalid_birth';end if;
 update public.pregnancies set birth_date=born_on,birth_time=born_at,baby_name=child_name,sex=child_sex where id=pid and household_id=hid and birth_date is null;
 if not found then raise exception 'already_recorded';end if;
end $$;
revoke update(birth_date,birth_time) on public.pregnancies from authenticated;
create function public.save_preferences(new_theme text,motion boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'forbidden';end if;
 insert into public.member_preferences(user_id,theme,reduce_motion) values(auth.uid(),new_theme,motion) on conflict(user_id) do update set theme=excluded.theme,reduce_motion=excluded.reduce_motion;
end $$;
revoke all on function public.set_appointment_status(uuid,uuid,text),public.toggle_appointment_step(uuid,uuid,integer,boolean),public.save_care_plan(uuid,text,jsonb),public.set_rh_negative(uuid,boolean),public.confirm_birth(uuid,uuid,date,time,text,text),public.save_preferences(text,boolean) from public,anon;
grant execute on function public.set_appointment_status(uuid,uuid,text),public.toggle_appointment_step(uuid,uuid,integer,boolean),public.save_care_plan(uuid,text,jsonb),public.set_rh_negative(uuid,boolean),public.confirm_birth(uuid,uuid,date,time,text,text),public.save_preferences(text,boolean) to authenticated;

revoke all on function private.goal_visible(uuid,uuid,text) from public,anon;grant execute on function private.goal_visible(uuid,uuid,text) to authenticated;
create function public.register_care_window(hid uuid,wkey text,new_status text) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.has_permission(hid,'appointments.edit') then raise exception 'forbidden';end if;
 if new_status='remove' then delete from public.care_registrations where household_id=hid and window_key=wkey;else insert into public.care_registrations(household_id,window_key,status) values(hid,wkey,new_status) on conflict(household_id,window_key) do update set status=excluded.status,recorded_at=now();end if;
end $$;
revoke all on function public.register_care_window(uuid,text,text) from public,anon;grant execute on function public.register_care_window(uuid,text,text) to authenticated;
commit;
