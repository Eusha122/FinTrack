-- ==========================================================
-- FinTrack - Supabase Auth + User-Scoped Data + RLS
-- Run in Supabase SQL Editor
-- ==========================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ----------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  monthly_budget numeric not null default 0 check (monthly_budget >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- Transactions
-- ----------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric not null check (amount > 0),
  category text not null default 'Others',
  note text,
  account text not null check (account in ('cash', 'bank')),
  target_account text check (target_account in ('cash', 'bank')),
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- Categories
-- ----------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ----------------------------------------------------------
-- Recurring Transactions
-- ----------------------------------------------------------
create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null default 'Others',
  note text,
  account text not null check (account in ('cash', 'bank')),
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  next_run timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- Support upgrading older schema
-- ----------------------------------------------------------
alter table if exists transactions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table if exists categories
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table if exists recurring_transactions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table if exists profiles
  add column if not exists monthly_budget numeric not null default 0;

alter table if exists profiles
  drop constraint if exists profiles_monthly_budget_check;

alter table if exists profiles
  add constraint profiles_monthly_budget_check check (monthly_budget >= 0);

-- Older schema used unique(name); replace with per-user uniqueness.
alter table if exists categories
  drop constraint if exists categories_name_key;

create unique index if not exists idx_categories_user_name
  on categories(user_id, name);

-- ----------------------------------------------------------
-- Performance indexes
-- ----------------------------------------------------------
create index if not exists idx_transactions_user_date on transactions(user_id, date desc);
create index if not exists idx_transactions_user_created on transactions(user_id, created_at desc);
create index if not exists idx_transactions_user_category on transactions(user_id, category);
create index if not exists idx_transactions_user_account on transactions(user_id, account);

create index if not exists idx_categories_user on categories(user_id);
create index if not exists idx_recurring_user_next_run on recurring_transactions(user_id, next_run);
create index if not exists idx_recurring_user_active on recurring_transactions(user_id, is_active);

-- ----------------------------------------------------------
-- Updated_at trigger for profiles
-- ----------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row
execute function set_updated_at();

-- ----------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table categories enable row level security;
alter table recurring_transactions enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_delete_own" on profiles;

create policy "profiles_select_own" on profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on profiles
for delete using (auth.uid() = id);

drop policy if exists "transactions_select_own" on transactions;
drop policy if exists "transactions_insert_own" on transactions;
drop policy if exists "transactions_update_own" on transactions;
drop policy if exists "transactions_delete_own" on transactions;

create policy "transactions_select_own" on transactions
for select using (auth.uid() = user_id);

create policy "transactions_insert_own" on transactions
for insert with check (auth.uid() = user_id);

create policy "transactions_update_own" on transactions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_delete_own" on transactions
for delete using (auth.uid() = user_id);

drop policy if exists "categories_select_own" on categories;
drop policy if exists "categories_insert_own" on categories;
drop policy if exists "categories_update_own" on categories;
drop policy if exists "categories_delete_own" on categories;

create policy "categories_select_own" on categories
for select using (auth.uid() = user_id);

create policy "categories_insert_own" on categories
for insert with check (auth.uid() = user_id);

create policy "categories_update_own" on categories
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_delete_own" on categories
for delete using (auth.uid() = user_id);

drop policy if exists "recurring_select_own" on recurring_transactions;
drop policy if exists "recurring_insert_own" on recurring_transactions;
drop policy if exists "recurring_update_own" on recurring_transactions;
drop policy if exists "recurring_delete_own" on recurring_transactions;

create policy "recurring_select_own" on recurring_transactions
for select using (auth.uid() = user_id);

create policy "recurring_insert_own" on recurring_transactions
for insert with check (auth.uid() = user_id);

create policy "recurring_update_own" on recurring_transactions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurring_delete_own" on recurring_transactions
for delete using (auth.uid() = user_id);
