-- Personal Expense Tracker — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sender_match text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#64748b',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  raw_sms text,
  sender text,
  amount numeric(12, 2) not null check (amount >= 0),
  direction text not null check (direction in ('debit', 'credit')),
  merchant text not null default 'Unknown',
  txn_date date not null default current_date,
  tagged boolean not null default false,
  source text not null default 'sms' check (source in ('sms', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, txn_date desc);
create index if not exists transactions_user_tagged_idx on public.transactions (user_id, tagged);

create table if not exists public.merchant_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  merchant_pattern text not null,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, merchant_pattern)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.merchant_rules enable row level security;

create policy "Own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Own merchant rules" on public.merchant_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed default categories for every new user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, color) values
    (new.id, 'Food & Dining',     '#ef4444'),
    (new.id, 'Groceries',         '#f97316'),
    (new.id, 'Transport',         '#eab308'),
    (new.id, 'Shopping',          '#8b5cf6'),
    (new.id, 'Bills & Utilities', '#06b6d4'),
    (new.id, 'Entertainment',     '#ec4899'),
    (new.id, 'Health',            '#22c55e'),
    (new.id, 'Travel',            '#3b82f6'),
    (new.id, 'Rent',              '#a16207'),
    (new.id, 'Transfers',         '#64748b'),
    (new.id, 'Income',            '#10b981'),
    (new.id, 'Other',             '#94a3b8')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
