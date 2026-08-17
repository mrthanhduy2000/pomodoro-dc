#!/bin/bash
# ĐO HIỆU NĂNG THÀNH PHỐ 3D TRÊN MACBOOK THẬT — Performance Gate.
#
# ══════════════════════════════════════════════════════════════════════════════════════
#  CÁCH DÙNG — MỞ TERMINAL, `cd` VÀO THƯ MỤC DỰ ÁN, RỒI CHẠY HAI LỆNH THEO ĐÚNG THỨ TỰ:
#
#      bash scripts/bench-macbook.sh --thu      ← thử 1 cảnh (~20 giây). Phải thấy "ĐẠT".
#      bash scripts/bench-macbook.sh            ← chạy thật (~5 phút, 25 cảnh).
#
#  Kết quả ghi vào .city-preview/bench-macbook.txt — gửi lại đúng file đó.
# ══════════════════════════════════════════════════════════════════════════════════════
#
# ⚠️ VÌ SAO PHẢI CHẠY TRÊN MÁY ĐÀM: hộp cát nơi AI làm việc không có card đồ hoạ — WebGL ở đó chạy
# bằng SwiftShader (tô hình bằng CPU), chậm hơn khoảng ba bậc VÀ tốn tiền ở chỗ khác. Mọi con số
# FPS đo ở đó đều vô nghĩa với câu hỏi "MacBook chịu được bao nhiêu".
#
# ⚠️ TỰ KIỂM TỰ ĐỘNG: mỗi cảnh in ra TÊN MÁY ĐỒ HOẠ, và nếu tên ấy chứa "SwiftShader"/"Software"
# thì script **DỪNG NGAY Ở CẢNH ĐẦU** thay vì chạy tiếp 25 cảnh rồi đẻ ra một bảng số vô giá trị.
# Trên Mac tên card phải là card thật ("Apple M2" / "ANGLE (Apple, ANGLE Metal Renderer...)").
#
# ⚠️ MỌI KẾT LUẬN VỀ DƯ ĐỊA ĐỀU GẮN VỚI MỘT CỠ CỬA SỔ — một con số ms không có cỡ cửa sổ đi kèm thì
# không nói lên điều gì, vì phần lớn chi phí là theo TỪNG ĐIỂM ẢNH. Vì vậy:
#   · 24 cảnh của ma trận chạy ở ĐÚNG MỘT cỡ **1100×700** để so được với nhau;
#   · thêm ĐÚNG MỘT cảnh cuối ở **1600×1000** (gấp 2,08 lần số điểm ảnh) để biết chi phí tăng theo
#     điểm ảnh như thế nào trên GPU thật — thứ mà hộp cát SwiftShader không trả lời được.
#
# ⚠️ MỖI CẢNH ĐỀU KIỂM MÃ THOÁT. Cảnh nào chết thì file ghi "!!! CẢNH NÀY HỎNG" chứ KHÔNG để trống:
# một khoảng trống trông y hệt "cảnh này không có gì đáng nói", và đó là cách một bảng số thiếu
# một phần tư dữ liệu vẫn được đọc như thể đầy đủ.
set -u

RA=".city-preview/bench-macbook.txt"
RONG=1100
CAO=700
RONG_LON=1600
CAO_LON=1000
KHUNG=120          # số khung hình mỗi cảnh của ma trận
KHUNG_THU=30       # cảnh thử: ít khung hơn cho nhanh (~20 giây kể cả lúc gói bundle)

THU=0
[ "${1:-}" = "--thu" ] && THU=1

mkdir -p .city-preview

# ── Chạy MỘT cảnh. Trả về 0 nếu ổn, 1 nếu hỏng. In các dòng [bench]/[stats] ra màn hình + file. ──
# $1 = nhãn cảnh · $2 = số khung · $3 = bề rộng · $4 = bề cao · $5.. = cờ thêm
TEN_CARD=""
chay_canh() {
  local nhan="$1" khung="$2" rong="$3" cao="$4"
  shift 4
  local tam ma dong
  tam="$(mktemp)"

  node scripts/city-preview.mjs \
    --sessions 80 --level 3 \
    --width "$rong" --height "$cao" \
    --bench "$khung" --gpu "$@" >"$tam" 2>&1
  ma=$?

  # Tên card lấy từ chính đầu ra của cảnh này — không đoán, không nhớ từ cảnh trước.
  # ⚠️ `[^"]*` chứ KHÔNG phải `.*`: Chromium bọc mỗi dòng console vào nháy kép rồi dán thêm
  # `", source: http://127.0.0.1:xxxxx/preview.js (42867)`. Lấy `.*` thì tên card kéo theo cả cái
  # đuôi ấy, và dòng "máy đồ hoạ:" trong báo cáo hiện ra một chuỗi rác dài — đã thấy tận mắt.
  TEN_CARD="$(grep -m1 -oE 'máy đồ hoạ=[^"]*' "$tam" | sed 's/^máy đồ hoạ=//' || true)"
  dong="$(grep -oE '\[bench\][^"]*|\[stats\][^"]*' "$tam" || true)"

  if [ "$ma" -ne 0 ] || [ -z "$dong" ]; then
    {
      echo "!!! CẢNH NÀY HỎNG — $nhan"
      echo "!!! mã thoát của node = $ma; số dòng đo lấy được = $(printf '%s' "$dong" | grep -c . || true)"
      echo "!!! 20 dòng cuối của đầu ra, để tìm nguyên nhân:"
      tail -n 20 "$tam" | sed 's/^/!!!   /'
    } | tee -a "$RA"
    rm -f "$tam"
    return 1
  fi

  printf '%s\n' "$dong" | tee -a "$RA"
  rm -f "$tam"
  return 0
}

# ── Card có phải card thật không. Gọi NGAY SAU cảnh đầu tiên, trước khi phí công chạy 24 cảnh. ──
kiem_card() {
  case "$TEN_CARD" in
    *SwiftShader*|*swiftshader*|*Software*|*software*|*llvmpipe*)
      {
        echo ""
        echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        echo "!!! DỪNG. Trình duyệt KHÔNG dùng card đồ hoạ thật."
        echo "!!! Máy đồ hoạ đang dùng: $TEN_CARD"
        echo "!!! Đây là bộ tô hình bằng CPU. Mọi con số đo được sẽ VÔ NGHĨA với câu hỏi"
        echo "!!! \"MacBook chịu được bao nhiêu\", nên script dừng ở đây thay vì chạy tiếp."
        echo "!!! Hãy gửi lại đúng dòng này cho AI để xử lý."
        echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
      } | tee -a "$RA"
      return 1;;
  esac
  return 0
}

# ══════════════════════════ CHẾ ĐỘ THỬ — ĐÚNG 1 CẢNH ══════════════════════════
if [ "$THU" -eq 1 ]; then
  : > "$RA"
  echo "=== THỬ NHANH (1 cảnh) — nếu thấy ĐẠT thì hãy chạy lệnh thật ===" | tee -a "$RA"
  echo "máy: $(uname -s) $(uname -m) · cửa sổ ${RONG}×${CAO}" | tee -a "$RA"
  echo "" | tee -a "$RA"

  if ! chay_canh "thử · kỷ 7 · 12 giờ · góc rộng" "$KHUNG_THU" "$RONG" "$CAO" \
       --era 7 --hour 12 --zoom 1; then
    echo "" | tee -a "$RA"
    echo "❌ HỎNG — cảnh thử không chạy được. Đừng chạy lệnh thật." | tee -a "$RA"
    echo "   Gửi lại file $RA cho AI." | tee -a "$RA"
    exit 1
  fi

  echo "" | tee -a "$RA"
  echo "máy đồ hoạ: ${TEN_CARD:-(không đọc được)}" | tee -a "$RA"
  if ! kiem_card; then
    echo "❌ HỎNG — chạy được nhưng KHÔNG dùng card thật (xem dòng trên)." | tee -a "$RA"
    exit 1
  fi
  echo "✅ ĐẠT — card thật, cảnh chạy tốt. Giờ chạy: bash scripts/bench-macbook.sh" | tee -a "$RA"
  exit 0
fi

# ══════════════════════════ CHẠY THẬT — MA TRẬN 24 CẢNH + 1 ══════════════════════════
: > "$RA"
echo "=== BỘ ĐO HIỆU NĂNG THÀNH PHỐ 3D ===" | tee -a "$RA"
echo "máy: $(uname -s) $(uname -m)" | tee -a "$RA"
echo "ma trận: kỷ 3/7/11/14 × giờ 12/15/22 × zoom 1 và 0.4 = 24 cảnh, TẤT CẢ ở cửa sổ ${RONG}×${CAO}" | tee -a "$RA"
echo "cộng thêm 1 cảnh cuối ở ${RONG_LON}×${CAO_LON} để đo chi phí tăng theo điểm ảnh" | tee -a "$RA"
echo "mỗi cảnh $KHUNG khung hình · --sessions 80 --level 3 · DPR đúng như app" | tee -a "$RA"
echo "" | tee -a "$RA"

DAT=0
TONG=0
DAU_TIEN=1

for e in 3 7 11 14; do
  for h in 12 15 22; do
    for z in 1 0.4; do
      goc="rộng"; [ "$z" != "1" ] && goc="gần"
      nhan="kỷ $e · ${h} giờ · góc $goc (zoom $z) · cửa sổ ${RONG}×${CAO}"
      TONG=$((TONG + 1))
      echo "### $nhan" | tee -a "$RA"
      if chay_canh "$nhan" "$KHUNG" "$RONG" "$CAO" --era "$e" --hour "$h" --zoom "$z"; then
        DAT=$((DAT + 1))
      fi
      echo "" | tee -a "$RA"

      # Cổng card: kiểm NGAY SAU cảnh đầu tiên. Chạy hết 25 cảnh rồi mới phát hiện dùng CPU
      # rasteriser là mất 5 phút của Đàm để đổi lấy một bảng số phải vứt đi.
      if [ "$DAU_TIEN" -eq 1 ]; then
        DAU_TIEN=0
        echo "máy đồ hoạ: ${TEN_CARD:-(không đọc được)}" | tee -a "$RA"
        echo "" | tee -a "$RA"
        if ! kiem_card; then exit 1; fi
      fi
    done
  done
done

# ── Cảnh cuối ở cửa sổ LỚN. Cùng kỷ/giờ/zoom với một cảnh đã có ở trên, nên hai dòng đặt cạnh nhau
#    là đọc thẳng ra "gấp 2,08 lần điểm ảnh thì tốn thêm bao nhiêu" trên GPU thật. ──────────────
nhan_lon="kỷ 7 · 12 giờ · góc rộng (zoom 1) · cửa sổ ${RONG_LON}×${CAO_LON} — ĐỐI CHIẾU ĐIỂM ẢNH"
echo "### $nhan_lon" | tee -a "$RA"
echo "### (so thẳng với dòng 'kỷ 7 · 12 giờ · góc rộng' ở cửa sổ ${RONG}×${CAO} phía trên:" | tee -a "$RA"
echo "###  $((RONG_LON * CAO_LON)) điểm ảnh so với $((RONG * CAO)) — gấp 2,08 lần)" | tee -a "$RA"
if chay_canh "$nhan_lon" "$KHUNG" "$RONG_LON" "$CAO_LON" --era 7 --hour 12 --zoom 1; then
  LON_DAT=1
else
  LON_DAT=0
fi
echo "" | tee -a "$RA"

# ── Tổng kết: nói RÕ đã chạy được bao nhiêu. Thiếu thì phải kêu to. ──────────────────────────
{
  echo "════════════════════════════════════════════════════════════════"
  echo "ĐÃ CHẠY ĐƯỢC $DAT/$TONG cảnh của ma trận (cửa sổ ${RONG}×${CAO})"
  if [ "$LON_DAT" -eq 1 ]; then
    echo "cộng cảnh đối chiếu ở ${RONG_LON}×${CAO_LON}: ĐẠT"
  else
    echo "!!! cảnh đối chiếu ở ${RONG_LON}×${CAO_LON}: HỎNG"
  fi
  echo "máy đồ hoạ: ${TEN_CARD:-(không đọc được)}"
  if [ "$DAT" -ne "$TONG" ] || [ "$LON_DAT" -ne 1 ]; then
    echo ""
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!! THIẾU $((TONG - DAT)) CẢNH CỦA MA TRẬN. Bảng số này CHƯA ĐỦ để kết luận."
    echo "!!! Tìm chữ \"CẢNH NÀY HỎNG\" trong file để biết cảnh nào chết và vì sao."
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  else
    echo "✅ đủ cảnh."
  fi
  echo "⚠️ Mọi kết luận về dư địa rút ra từ file này chỉ đúng cho CỬA SỔ ${RONG}×${CAO}"
  echo "   (và dòng đối chiếu cho ${RONG_LON}×${CAO_LON}). Đổi cỡ cửa sổ là đổi bài toán."
  echo "════════════════════════════════════════════════════════════════"
  echo "=== XONG — gửi lại file $RA ==="
} | tee -a "$RA"

[ "$DAT" -eq "$TONG" ] && [ "$LON_DAT" -eq 1 ]
