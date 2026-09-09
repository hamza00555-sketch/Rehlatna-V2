-- Apply on the new Supabase project after the foundation migration.
-- Upload UI is intentionally a later slice; this bucket is private from its creation.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('private-attachments','private-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy attachment_owner_read on storage.objects for select to authenticated
using(bucket_id='private-attachments' and (storage.foldername(name))[2]=(select auth.uid())::text
and exists(select 1 from public.memberships m where m.household_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid()) and m.active));
create policy attachment_owner_insert on storage.objects for insert to authenticated
with check(bucket_id='private-attachments' and (storage.foldername(name))[2]=(select auth.uid())::text
and exists(select 1 from public.memberships m where m.household_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid()) and m.active));
create policy attachment_owner_delete on storage.objects for delete to authenticated
using(bucket_id='private-attachments' and (storage.foldername(name))[2]=(select auth.uid())::text
and exists(select 1 from public.memberships m where m.household_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid()) and m.active));
commit;
