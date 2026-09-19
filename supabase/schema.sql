-- BrokeBro Supabase schema (run in Supabase SQL editor)
-- All private tables use Row Level Security: users access only their own rows (auth.uid() = user_id).

create extension if not exists "pgcrypto";

-- Profiles (1 per auth user)
create table if not exists profiles (
  user_id uuid primary references auth.users(id) on delete cascade,
  name text not null default '',
  currency text not null default 'INR',
  monthly_income numeric not null default 0,
  next_income_date date,
  savings_goal_name text,
  onboarded boolean not null default false,
  created_at timestamptz default now()
);

-- Transactions (expenses + income)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense','income')),
  amount numeric not null check (amount > 0),
  category text not null default 'Other',
  note text not null default '',
  date timestamptz not null default now(),
  payment_method text not null default 'UPI',
  recurring boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_txns_user_date on transactions(user_id, date desc);
create index if not exists idx_txns_user_cat on transactions(user_id, category);

-- Budgets
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'monthly' check (scope in ('monthly','weekly')),
  category text not null default 'TOTAL',
  limit_amount numeric not null check (limit_amount > 0),
  period_key text not null default '',
  created_at timestamptz default now()
);
create index if not exists idx_budgets_user on budgets(user_id);

-- Savings goals
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'Other',
  target numeric not null check (target > 0),
  saved numeric not null default 0,
  target_date date,
  created_at timestamptz default now()
);

-- Goal contributions (audit trail)
create table if not exists goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references savings_goals(id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

-- Split groups + members + expenses
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
create table if not exists group_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  description text not null default '',
  amount numeric not null check (amount > 0),
  paid_by text not null,
  shares jsonb not null default '{}',
  date timestamptz not null default now()
);
create index if not exists idx_gex_group on group_expenses(group_id);

-- Quests / gamification
create table if not exists quests (
  id text primary key,
  title text not null,
  description text not null default '',
  xp integer not null default 10,
  badge text not null default '🏅',
  target integer not null default 1
);
create table if not exists user_quests (
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id text not null references quests(id) on delete cascade,
  progress integer not null default 0,
  done boolean not null default false,
  xp_claimed boolean not null default false,
  primary key (user_id, quest_id)
);
create table if not exists user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge text not null,
  earned_at timestamptz default now(),
  primary key (user_id, badge)
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_notif_user on notifications(user_id, created_at desc);

-- RLS
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table savings_goals enable row level security;
alter table goal_contributions enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_expenses enable row level security;
alter table user_quests enable row level security;
alter table user_achievements enable row level security;
alter table notifications enable row level security;

-- Helper: owner check for group children via groups.owner_id
-- Policies (drop + recreate to stay idempotent)
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own txns" on transactions;
create policy "own txns" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own budgets" on budgets;
create policy "own budgets" on budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own goals" on savings_goals;
create policy "own goals" on savings_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own contributions" on goal_contributions;
create policy "own contributions" on goal_contributions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own groups" on groups;
create policy "own groups" on groups for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "member via owner" on group_members;
create policy "member via owner" on group_members for all using (exists (select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid())) with check (exists (select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid()));
drop policy if exists "expense via owner" on group_expenses;
create policy "expense via owner" on group_expenses for all using (exists (select 1 from groups g where g.id = group_expenses.group_id and g.owner_id = auth.uid())) with check (exists (select 1 from groups g where g.id = group_expenses.group_id and g.owner_id = auth.uid()));
drop policy if exists "own user_quests" on user_quests;
create policy "own user_quests" on user_quests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own achievements" on user_achievements;
create policy "own achievements" on user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own notifications" on notifications;
create policy "own notifications" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
