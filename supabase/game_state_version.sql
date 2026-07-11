-- "First action wins": máy nào ghi lên server TRƯỚC thì thắng, máy ghi sau phải tự
-- nhận lại đúng bản đã thắng thay vì ghi đè chồng chéo lên nhau (chống lỗi 2 máy
-- giành nhau khi dùng cùng lúc — xem sự cố 2026-07-11 ở BAN_GIAO.md: điện thoại
-- và laptop liên tục ghi đè lẫn nhau, làm mất 1 phiên focus thật).
--
-- Trigger tự tăng `version` mỗi lần ghi, do SERVER cấp phát (không phụ thuộc đồng
-- hồ máy khách nên không bị lệch giờ giữa 2 thiết bị). Client (src/lib/syncService.js)
-- dùng version này làm điều kiện ghi có-kiểm-tra (compare-and-swap): chỉ ghi thành
-- công nếu version đang chờ vẫn khớp; nếu một máy khác đã ghi trước (version đã đổi)
-- thì lần ghi này bị từ chối (0 dòng khớp) — máy đó phải nhận lại bản mới nhất thay
-- vì ép ghi đè.
alter table public.game_state add column if not exists version integer not null default 0;

create or replace function public.bump_game_state_version()
returns trigger as $$
begin
  new.version := coalesce(old.version, 0) + 1;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_bump_game_state_version on public.game_state;
create trigger trg_bump_game_state_version
before update on public.game_state
for each row
execute function public.bump_game_state_version();
