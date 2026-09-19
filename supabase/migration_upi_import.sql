-- BrokeBro migration: UPI screenshot imports
-- Run in Supabase SQL editor AFTER supabase/schema.sql.

alter table transactions
  add column if not exists merchant text,
  add column if not exists status text default 'Unknown',
  add column if not exists transaction_id text,
  add column if not exists source text default 'manual' check (source in ('manual','upi_screenshot','other')),
  add column if not exists source_image_path text;

create index if not exists idx_txns_user_txnid on transactions(user_id, transaction_id);
create index if not exists idx_txns_user_source on transactions(user_id, source);

-- Private screenshot bucket (opt-in retention only; never public).
insert into storage.buckets (id, name, public)
values ('upi-screenshots', 'upi-screenshots', false)
on conflict (id) do nothing;

-- Strict access: users see only their own folder (path starts with auth.uid()).
drop policy if exists "own screenshots read" on storage.objects;
create policy "own screenshots read" on storage.objects
  for select using (bucket_id = 'upi-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "own screenshots write" on storage.objects;
create policy "own screenshots write" on storage.objects
  for insert with check (bucket_id = 'upi-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "own screenshots delete" on storage.objects;
create policy "own screenshots delete" on storage.objects
  for delete using (bucket_id = 'upi-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
