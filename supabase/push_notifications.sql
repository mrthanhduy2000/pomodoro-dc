create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  device_id text,
  user_agent text,
  platform text,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.push_jobs (
  job_key text primary key,
  scheduled_for timestamptz not null,
  payload jsonb not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'processing', 'sent', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  cancelled_at timestamptz,
  last_error text
);

alter table if exists public.push_jobs
  drop constraint if exists push_jobs_status_check;

alter table if exists public.push_jobs
  add constraint push_jobs_status_check
  check (status in ('scheduled', 'processing', 'sent', 'cancelled'));

create index if not exists push_subscriptions_enabled_idx
  on public.push_subscriptions (enabled);

create index if not exists push_jobs_status_scheduled_for_idx
  on public.push_jobs (status, scheduled_for);

alter table public.push_subscriptions enable row level security;
alter table public.push_jobs enable row level security;

grant select, insert, update on public.push_subscriptions to anon;
grant select, insert, update on public.push_jobs to anon;
grant select, insert, update on public.push_subscriptions to service_role;
grant select, insert, update on public.push_jobs to service_role;
