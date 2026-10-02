-- v2 rewrite (ADR-101): the whole v2 app state is ONE append-only event log.
--
-- Why append-only instead of v1's single `game_state` row with compare-and-swap:
-- two devices can never overwrite each other — merging two logs is a union by `id`.
-- v1's CAS made the LOSING device drop its unsent changes (TECH_DEBT #8); here nothing is lost.
--
-- Safety: the anon key may SELECT and INSERT only. There is no UPDATE or DELETE grant and no
-- policy for them, so even a buggy client cannot rewrite or erase history.
-- This file does not touch any v1 table. Run it once in the Supabase SQL editor.

create table if not exists public.events_v2 (
  id text primary key,                -- client-generated; deterministic for facts several devices may emit
  seq bigserial not null unique,      -- server order, used only as the pull cursor
  at timestamptz not null,            -- when it happened (client clock); the reducer orders by this
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  device text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists events_v2_seq_idx on public.events_v2 (seq);

alter table public.events_v2 enable row level security;

drop policy if exists events_v2_read on public.events_v2;
create policy events_v2_read on public.events_v2 for select to anon, authenticated using (true);

drop policy if exists events_v2_append on public.events_v2;
create policy events_v2_append on public.events_v2 for insert to anon, authenticated with check (true);

grant select, insert on public.events_v2 to anon, authenticated;
grant usage, select on sequence public.events_v2_seq_seq to anon, authenticated;
grant all on public.events_v2 to service_role;

-- Live updates between devices (the client also polls, so this is an accelerator, not a dependency).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events_v2'
  ) then
    alter publication supabase_realtime add table public.events_v2;
  end if;
end $$;
