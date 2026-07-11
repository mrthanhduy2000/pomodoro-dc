-- Tự dọn nhật ký chạy job (cron.job_run_details) mỗi đêm.
-- Lý do: job `dc-pomodoro-push-dispatch` (xem push_dispatch_scheduler.sql) chạy mỗi 5 giây,
-- mỗi lần chạy tự ghi 1 dòng log vào bảng nội bộ này. Không dọn thì sau vài tháng bảng log
-- phình to tới mức vượt hạn mức "Database Size" của gói Free (đã xảy ra thật: 2026-07 phình
-- tới 795 MB dù dữ liệu game thật chỉ ~15 KB, khiến project bị Supabase tự tạm dừng).
-- Job này giữ log 3 ngày gần nhất (đủ để soi lỗi nếu cần), xoá phần cũ hơn mỗi đêm.
select cron.unschedule(jobid)
from cron.job
where jobname = 'cleanup-job-run-details';

select
  cron.schedule(
    'cleanup-job-run-details',
    '0 20 * * *',
    $$delete from cron.job_run_details where end_time < now() - interval '3 days'$$
  );
