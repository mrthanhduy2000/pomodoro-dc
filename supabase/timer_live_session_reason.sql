alter table if exists public.timer_live
  add column if not exists mode text not null default 'pomodoro';

alter table if exists public.timer_live
  add column if not exists ended_reason text;

alter table if exists public.timer_live
  drop constraint if exists timer_live_mode_check;

alter table if exists public.timer_live
  add constraint timer_live_mode_check
  check (mode in ('pomodoro', 'stopwatch', 'break'));

alter table if exists public.timer_live
  drop constraint if exists timer_live_ended_reason_check;

alter table if exists public.timer_live
  add constraint timer_live_ended_reason_check
  check (ended_reason is null or ended_reason in ('completed', 'cancelled', 'reset'));
