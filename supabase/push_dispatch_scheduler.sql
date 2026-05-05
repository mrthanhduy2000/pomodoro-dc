create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid)
from cron.job
where jobname = 'dc-pomodoro-push-dispatch';

select
  cron.schedule(
    'dc-pomodoro-push-dispatch',
    '1 second',
    $$
    select
      net.http_post(
        url:='https://pomodoro-dc.vercel.app/api/push/dispatch',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer REPLACE_WITH_YOUR_CRON_SECRET'
        ),
        body:='{"source":"supabase-cron"}'::jsonb
      ) as request_id;
    $$
  );
