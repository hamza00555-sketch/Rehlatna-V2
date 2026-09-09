begin;
create function public.save_provider(hid uuid,pid uuid,value jsonb,linked_hospitals uuid[]) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.providers; result uuid;
begin
 if not private.has_permission(hid,'care.edit') then raise exception 'forbidden';end if;
 r=jsonb_populate_record(null::public.providers,value);
 if cardinality(linked_hospitals)>40 or (r.kind='doctor' and cardinality(linked_hospitals)>1) or (r.kind='hospital' and cardinality(linked_hospitals)>0) then raise exception 'invalid_links';end if;
 if exists(select 1 from unnest(linked_hospitals) v where not exists(select 1 from public.providers where household_id=hid and id=v and kind='hospital')) then raise exception 'invalid_hospital';end if;
 if pid is null then
 insert into public.providers(household_id,kind,name,city,phone,website,doctor_role,specialty,purposes,coverage,program,notes) values(hid,r.kind,r.name,r.city,r.phone,r.website,r.doctor_role,r.specialty,r.purposes,r.coverage,r.program,r.notes) returning id into result;
 else
 update public.providers set name=r.name,city=r.city,phone=r.phone,website=r.website,doctor_role=r.doctor_role,specialty=r.specialty,purposes=r.purposes,coverage=r.coverage,program=r.program,notes=r.notes where id=pid and household_id=hid and kind=r.kind returning id into result;
 if result is null then raise exception 'not_found';end if;
 end if;
 delete from public.provider_links where household_id=hid and parent_id=result;
 insert into public.provider_links(household_id,parent_id,child_id) select hid,result,v from unnest(linked_hospitals) v on conflict do nothing;
 return result;
end $$;
create function public.toggle_travel_step(hid uuid,step_index integer,is_done boolean) returns void language plpgsql security definer set search_path='' as $$declare steps jsonb;begin
 if not private.has_permission(hid,'care.edit') then raise exception 'forbidden';end if;
 select travel_steps into steps from public.care_plans where household_id=hid for update;
 if steps is null or step_index<0 or step_index>=jsonb_array_length(steps) then raise exception 'invalid_step';end if;
 update public.care_plans set travel_steps=jsonb_set(steps,array[step_index::text,'done'],to_jsonb(is_done)) where household_id=hid;
end $$;
create function private.monthly_amount(target bigint,saved bigint,funding date) returns bigint language sql stable set search_path='' as $$select ceil(greatest(0,target-saved)::numeric/100/greatest(1,(extract(year from funding)-extract(year from current_date))*12+extract(month from funding)-extract(month from current_date)+1))::bigint*100$$;
create or replace function private.finance_change_audit() returns trigger language plpgsql security definer set search_path='' as $$declare contribution bigint;begin
 select coalesce(sum(amount_cents),0) into contribution from public.finance_contributions where goal_id=new.id;
 insert into public.finance_changes(household_id,goal_id,before_value,after_value) values(new.household_id,new.id,
 to_jsonb(old)||jsonb_build_object('_monthly',private.monthly_amount(coalesce(old.actual_cents,old.expected_cents),old.initial_cents+contribution,old.funding_date),'_saved',old.initial_cents+contribution),
 to_jsonb(new)||jsonb_build_object('_monthly',private.monthly_amount(coalesce(new.actual_cents,new.expected_cents),new.initial_cents+contribution,new.funding_date),'_saved',new.initial_cents+contribution,'_reason',case when new.funding_date is distinct from old.funding_date then 'تغيّر تاريخ التمويل، فتغيّر عدد أشهر الادّخار.' when coalesce(new.actual_cents,new.expected_cents) is distinct from coalesce(old.actual_cents,old.expected_cents) then 'تغيّرت التكلفة المستهدفة، فتغيّر المتبقي.' else 'تغيّرت تفاصيل الهدف؛ الحساب يعتمد على المتبقي وتاريخ التمويل.' end));return new;
end $$;
create function private.contribution_audit() returns trigger language plpgsql security definer set search_path='' as $$declare g public.finance_goals; saved bigint;before_saved bigint;gid uuid;begin
 gid=case when tg_op='INSERT' then new.goal_id else old.goal_id end;
 select * into g from public.finance_goals where id=gid for update;if g.id is null then return null;end if;
 select g.initial_cents+coalesce(sum(amount_cents),0) into saved from public.finance_contributions where goal_id=gid;
 before_saved=case when tg_op='INSERT' then saved-new.amount_cents else saved+old.amount_cents end;
 insert into public.finance_changes(household_id,goal_id,before_value,after_value) values(g.household_id,g.id,
 to_jsonb(g)||jsonb_build_object('_monthly',private.monthly_amount(coalesce(g.actual_cents,g.expected_cents),before_saved,g.funding_date),'_saved',before_saved),
 to_jsonb(g)||jsonb_build_object('_monthly',private.monthly_amount(coalesce(g.actual_cents,g.expected_cents),saved,g.funding_date),'_saved',saved,'_reason',case when tg_op='INSERT' then 'أُضيفت مساهمة جديدة، فقلّ المتبقي.' else 'حُذفت مساهمة، فأُعيد حساب المتبقي.' end));return null;
end $$;
create trigger contribution_audit after insert or delete on public.finance_contributions for each row execute function private.contribution_audit();
revoke all on function public.save_provider(uuid,uuid,jsonb,uuid[]),public.toggle_travel_step(uuid,integer,boolean) from public,anon;
grant execute on function public.save_provider(uuid,uuid,jsonb,uuid[]),public.toggle_travel_step(uuid,integer,boolean) to authenticated;
revoke all on function private.monthly_amount(bigint,bigint,date),private.contribution_audit() from public,anon,authenticated;
create or replace function public.save_care_plan(hid uuid,section text,value jsonb) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.has_permission(hid,'care.edit') then raise exception 'forbidden';end if;
 insert into public.care_plans(household_id) values(hid) on conflict(household_id) do nothing;
 if section='birth' then
 update public.care_plans set hospital_id=(value->>'hospital_id')::uuid,doctor_id=(value->>'doctor_id')::uuid,insurance_id=(value->>'insurance_id')::uuid,support=coalesce(value->>'support',''),preferences=coalesce(value->>'preferences','') where household_id=hid;
 elsif section='travel' then
 update public.care_plans set travel_from=value->>'travel_from',travel_to=value->>'travel_to',move_date=(value->>'move_date')::date,return_date=(value->>'return_date')::date,travel_steps=coalesce((select jsonb_agg(n||jsonb_build_object('done',coalesce((select (o->>'done')::boolean from jsonb_array_elements(care_plans.travel_steps) o where o->>'title'=n->>'title' limit 1),false))) from jsonb_array_elements(value->'travel_steps') n),'[]'),travel_notes=coalesce(value->>'travel_notes','') where household_id=hid;
 elsif section='feeding' then
 update public.care_plans set feeding=array(select jsonb_array_elements_text(value->'feeding')),feeding_notes=coalesce(value->>'feeding_notes','') where household_id=hid;
 else raise exception 'invalid_section';end if;
end $$;

commit;
