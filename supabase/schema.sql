-- Run this in Supabase Dashboard > SQL Editor.
-- There are intentionally no public table policies. Browser clients must use
-- the Edge Function; never expose the service-role key in the website.

create extension if not exists pgcrypto;

create table if not exists public.santa_groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  created_at timestamptz not null default now(),
  drawn_at timestamptz not null default now()
);

create table if not exists public.santa_participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.santa_groups(id) on delete cascade,
  username text not null,
  username_normalized text not null,
  access_code_hash text not null,
  created_at timestamptz not null default now(),
  unique (group_id, username_normalized),
  unique (id, group_id)
);

create table if not exists public.santa_assignments (
  group_id uuid not null,
  giver_id uuid not null,
  recipient_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (group_id, giver_id),
  unique (group_id, recipient_id),
  foreign key (giver_id, group_id)
    references public.santa_participants(id, group_id) on delete cascade,
  foreign key (recipient_id, group_id)
    references public.santa_participants(id, group_id) on delete cascade,
  constraint no_self_assignment check (giver_id <> recipient_id)
);

alter table public.santa_groups enable row level security;
alter table public.santa_participants enable row level security;
alter table public.santa_assignments enable row level security;

-- No anon/authenticated policies are created. The Edge Function uses the
-- server-only SUPABASE_SERVICE_ROLE_KEY and performs access checks itself.
