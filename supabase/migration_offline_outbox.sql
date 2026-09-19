-- BrokeBro migration: offline outbox idempotency
-- Run in Supabase SQL editor AFTER schema.sql + migration_upi_import.sql.
-- Gives every row a stable client-generated key so offline retries can NEVER
-- create duplicates: re-sending the same local row upserts instead of inserting.

alter table transactions add column if not exists client_key text;
alter table budgets add column if not exists client_key text;
alter table savings_goals add column if not exists client_key text;

-- Backfill existing rows so the unique index can apply cleanly.
update transactions set client_key = id::text where client_key is null;
update budgets set client_key = id::text where client_key is null;
update savings_goals set client_key = id::text where client_key is null;

create unique index if not exists uq_txns_user_client on transactions(user_id, client_key);
create unique index if not exists uq_budgets_user_client on budgets(user_id, client_key);
create unique index if not exists uq_goals_user_client on savings_goals(user_id, client_key);
