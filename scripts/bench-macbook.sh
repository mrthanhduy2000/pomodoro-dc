#!/bin/bash
# ĐO HIỆU NĂNG THÀNH PHỐ 3D TRÊN MACBOOK THẬT — Performance Gate.
#
# ══════════════════════════════════════════════════════════════════════════════════════
#  CÁCH DÙNG — MỞ TERMINAL, `cd` VÀO THƯ MỤC DỰ ÁN, RỒI CHẠY HAI LỆNH THEO ĐÚNG THỨ TỰ:
#
#      bash scripts/bench-macbook.sh --thu      ← kiểm máy + thử 1 cảnh. Phải thấy "ĐẠT".
#      bash scripts/bench-macbook.sh            ← chạy thật (~5 phút, 26 cảnh).
#
#  Kết quả ghi vào .city-preview/bench-macbook.txt — gửi lại đúng file đó.
#  Runbook đầy đủ cho người không biết code: xem PERFORMANCE.md mục "Cách chạy lại bộ đo".
# ══════════════════════════════════════════════════════════════════════════════════════
#
# ⚠️ VÌ SAO PHẢI CHẠY TRÊN MÁY ĐÀM: hộp cát nơi AI làm việc không có card đồ hoạ — WebGL ở đó chạy
# bằng SwiftShader (tô hình bằng CPU), chậm hơn khoảng ba bậc VÀ tốn tiền ở chỗ khác. Mọi con số
# FPS đo ở đó đều vô nghĩa với câu hỏi "MacBook chịu được bao nhiêu".
#
# ⚠️ NGUYÊN TẮC GỐC CỦA MỌI THÔNG BÁO TRONG FILE NÀY (vòng 4, sau khi Đàm mất 5 vòng qua lại chỉ để
# TỚI ĐƯỢC chỗ chạy lệnh): khi hỏng, phải in ra ĐÚNG MỘT LỆNH CẦN GÕ — không in nguyên nhân kỹ
# thuật rồi để người dùng tự suy. Một thông báo đúng về mặt kỹ thuật mà người nhận không biết phải
# làm gì thì bằng không có thông báo. Mọi lần sửa file này về sau phải giữ nguyên tắc ấy.
#
# ⚠️ TỰ KIỂM TỰ ĐỘNG: mỗi cảnh in ra TÊN MÁY ĐỒ HOẠ, và nếu tên ấy chứa "SwiftShader"/"Software"
# thì script **DỪNG NGAY Ở CẢNH ĐẦU** thay vì chạy tiếp 26 cảnh rồi đẻ ra một bảng số vô giá trị.
# Trên Mac tên card phải là card thật ("Apple M3" / "ANGLE (Apple, ANGLE Metal Renderer...)").
#
# ⚠️ MỌI KẾT LUẬN VỀ DƯ ĐỊA ĐỀU GẮN VỚI MỘT CỠ CỬA SỔ — một con số ms không có cỡ cửa sổ đi kèm thì
# không nói lên điều gì, vì phần lớn chi phí là theo TỪNG ĐIỂM ẢNH. Vì vậy:
#   · 24 cảnh của ma trận chạy ở ĐÚNG MỘT cỡ **1100×700** để so được với nhau;
#   · thêm HAI cảnh ở **1600×1000** (gấp 2,08 lần số điểm ảnh): một cảnh ĐỐI CHIẾU ĐIỂM ẢNH (cùng
#     kỷ/giờ/zoom với một dòng ở trên, nên hiệu số của chúng CHÍNH LÀ độ dốc theo điểm ảnh), và một
#     cảnh NẶNG NHẤT (kỷ nhiều tam giác nhất × 22 giờ có đèn) — chỗ ngân sách cạn TRƯỚC.
# ⚠️ Cảnh nặng nhất KHÔNG so thẳng được với trần 8 ms: trần ấy định nghĩa ở khung mặc định. Xem khối
# "CÁCH ĐỌC BẢNG NÀY" in ở cuối báo cáo — không có nó thì hai con số đúng bị đem so sai.
#
# ⚠️ MỖI CẢNH ĐỀU KIỂM MÃ THOÁT. Cảnh nào chết thì file ghi "!!! CẢNH NÀY HỎNG" chứ KHÔNG để trống:
# một khoảng trống trông y hệt "cảnh này không có gì đáng nói", và đó là cách một bảng số thiếu
# một phần tư dữ liệu vẫn được đọc như thể đầy đủ.
#
# ⚠️ MỌI BIẾN ĐƯỜNG DẪN TRONG FILE NÀY PHẢI ĐƯỢC BỌC NHÁY KÉP. Thư mục dự án trên máy Đàm là
# `Bản sao Pomodoro Game - USING` — có dấu tiếng Việt VÀ dấu cách. Một `$RA` không nháy là thư mục
# bị tách làm nhiều tham số, và triệu chứng ("không tìm thấy file" trỏ vào một đường dẫn cụt) trông
# chẳng liên quan gì tới nguyên nhân. Đã khoá bằng `scripts/benchMacbookSource.test.js`.
set -u

RA=".city-preview/bench-macbook.txt"
LOG_LOI=".city-preview/bench-loi-toanvan.log"   # đầu ra ĐẦY ĐỦ của mọi cảnh hỏng, để soi khi cần
RONG=1100
CAO=700
RONG_LON=1600
CAO_LON=1000
KHUNG=120          # số khung hình mỗi cảnh của ma trận
KHUNG_THU=30       # cảnh thử: ít khung hơn cho nhanh (~20 giây kể cả lúc gói bundle)
DIA_TOI_THIEU_MB=80   # dưới mức này thì cảnh báo — 25 ảnh + bundle không lọt vào chỗ chật hơn

THU=0
[ "${1:-}" = "--thu" ] && THU=1

# Chỉ chạy preflight rồi thoát. KHÔNG phải cờ cho Đàm — đây là mối nối để bài test hỏi được chuỗi
# kiểm mà không phải đợi 20 giây gói bundle. Giữ tên tiếng Việt để không ai nhầm nó là cờ chính thức.
CHI_KIEM="${BENCH_CHI_KIEM:-0}"

# ══════════════════════════════════════════════════════════════════════════════════════
#  PREFLIGHT — KIỂM MÔI TRƯỜNG TRƯỚC, CHẠY CẢNH SAU
# ══════════════════════════════════════════════════════════════════════════════════════
#
# ⚠️ VÌ SAO CÓ PHẦN NÀY (TECH_DEBT #34, đã cắn Đàm thật ngày 2026-08-17 — mất 4 vòng qua lại):
# trước đây script chạy thẳng vào việc gói bundle, nên máy thiếu `node_modules/three` thì VITE mới
# là thứ phát hiện ra, và nó nói bằng ngôn ngữ của nó: ~20 dòng lỗi phân giải module. Script báo
# đúng là "HỎNG" nhưng KHÔNG nói được VÌ SAO, nên người không đọc được lỗi Vite phải đoán qua lại
# vài lượt mới ra nguyên nhân — trong khi bản sửa chỉ là một câu tiếng Việt.
#
# ⚠️ KIỂM BẰNG SỰ TỒN TẠI CỦA THƯ MỤC, KHÔNG KIỂM BẰNG CÁCH CHẠY THỬ RỒI BẮT LỖI. Chạy thử chính là
# thứ sinh ra 20 dòng nhiễu; hỏi thẳng "thư mục này có không" thì câu trả lời là có/không, không
# kèm theo một trang lỗi nào.
#
# ⚠️ THỨ TỰ = RẺ TRƯỚC, ĐẮT SAU. Không được để người dùng đợi 20 giây dựng bundle rồi mới báo thiếu
# một thư mục kiểm được trong 1 mili-giây. Các mục dưới đây xếp đúng theo giá: kiểm thư mục (tức
# thì) → chạy node đọc phiên bản (~50 ms) → hỏi Chromium (~50 ms) → ghi thử một file → hỏi git.
#
# ⚠️ CHẶN vs CẢNH BÁO là hai việc khác nhau. Chặn = không có thứ này thì chạy tiếp chắc chắn vô
# nghĩa. Cảnh báo = vẫn chạy được, nhưng con số thu về có thể không nói lên điều mình tưởng. Đừng
# biến cảnh báo thành chặn cho "chắc ăn": một bộ đo từ chối chạy vì cây git bẩn là một bộ đo không
# ai dùng, mà công cụ không ai chạy thì bằng không có.

SO_LOI=0
SO_CANH_BAO=0

dat()      { echo "✅ $1" | tee -a "$RA"; }
canh_bao() { echo "⚠️  $1" | tee -a "$RA"; SO_CANH_BAO=$((SO_CANH_BAO + 1)); }

# $1 = điều đã kiểm (không đạt) · $2 = ĐÚNG MỘT lệnh cần gõ (rỗng = không có lệnh, in dòng $3)
loi() {
  {
    echo "❌ $1"
    if [ -n "${2:-}" ]; then
      echo "   ⇒ GÕ ĐÚNG LỆNH NÀY RỒI CHẠY LẠI:"
      echo ""
      echo "       $2"
      echo ""
    fi
    [ -n "${3:-}" ] && echo "   $3"
  } | tee -a "$RA"
  SO_LOI=$((SO_LOI + 1))
}

kiem_moi_truong() {
  echo "── KIỂM MÁY TRƯỚC KHI ĐO ─────────────────────────────────────────" | tee -a "$RA"
  echo "đang đứng ở: $PWD" | tee -a "$RA"

  # ── 0a. node có chạy được không ────────────────────────────────────────────────────────────
  # Thiếu node thì mọi mục sau đều vô nghĩa, và `bash: node: command not found` tuy đúng nhưng
  # không nói phải làm gì.
  if ! command -v node >/dev/null 2>&1; then
    loi "Không tìm thấy Node.js (lệnh \`node\`)." \
        "" \
        "Cài Node.js bản LTS ở https://nodejs.org rồi mở lại Terminal."
    return 1
  fi
  dat "Node.js — $(node --version)"

  # ── 0b. có đang đứng đúng thư mục dự án không ──────────────────────────────────────────────
  # ⚠️ PHẢI ĐỨNG TRƯỚC mục "thiếu node_modules". Đứng nhầm thư mục thì `node_modules` cũng không
  # có, và lúc ấy câu "chạy npm install" là LỜI KHUYÊN SAI — nó sẽ cài vào một thư mục chẳng liên
  # quan, mất vài phút, rồi hỏng y như cũ. Hai triệu chứng giống hệt nhau, hai cách sửa ngược nhau.
  if [ ! -f package.json ] || [ ! -f scripts/city-preview.mjs ]; then
    loi "Đang KHÔNG đứng trong thư mục dự án (ở đây không có \`package.json\`)." \
        "cd \"/Users/damduy/Downloads/Claude Code/Bản sao Pomodoro Game - USING\"" \
        "Nhớ giữ nguyên hai dấu nháy kép — đường dẫn có dấu cách."
    return 1
  fi
  dat "Thư mục dự án — đúng chỗ"

  # ── 1. node_modules/ ──────────────────────────────────────────────────────────────────────
  if [ ! -d node_modules ]; then
    loi "Chưa cài thư viện (không có thư mục \`node_modules\`)." \
        "npm install --legacy-peer-deps"
    return 1
  fi
  dat "node_modules/ — có"

  # ── 2. node_modules/three ─────────────────────────────────────────────────────────────────
  # ĐÂY LÀ CA ĐÃ CẮN ĐÀM. Trước vòng 4, tới đây script vẫn im lặng chạy tiếp rồi để Vite gào lên.
  if [ ! -d node_modules/three ]; then
    loi "Thiếu thư viện 3D (\`node_modules/three\`) — đây chính là thứ dùng để dựng thành phố." \
        "npm install --legacy-peer-deps" \
        "⚠️ BẮT BUỘC có \`--legacy-peer-deps\`, thiếu cờ đó thì npm sẽ báo lỗi (TECH_DEBT #7)."
    return 1
  fi
  dat "node_modules/three — có"

  # ── 3. phiên bản three đã cài có khớp package.json không (CẢNH BÁO, không chặn) ────────────
  # ⚠️ VÌ SAO MỤC NÀY PHẢI CÓ: hôm 2026-08-17, `npm install` báo "up to date" trong khi `three`
  # HOÀN TOÀN chưa có — vì nó chạy lúc `package.json` còn là bản cũ (chưa `git checkout`). Tức
  # **"npm nói ổn" không có nghĩa là đúng thư viện đang nằm đó**. Chỉ có cách đặt hai con số cạnh
  # nhau mới biết, đúng bài học "đừng DỰ ĐOÁN thứ có thể ĐO" của chính Performance Gate.
  local can dang
  can="$(node -p "require('./package.json').dependencies.three || ''" 2>/dev/null || true)"
  dang="$(node -p "require('./node_modules/three/package.json').version" 2>/dev/null || true)"
  # Bỏ tiền tố dải phiên bản (^ ~ >= <=) để so phần số. Dự án GHIM CỨNG three (không có `^`), nên
  # ở đây phép so bằng là chính xác; nếu sau này ai bỏ ghim thì mục này thành xấp xỉ — chấp nhận
  # được, vì nó chỉ CẢNH BÁO chứ không chặn.
  local can_so="${can#[\^~]}"
  can_so="${can_so#>=}"
  if [ -z "$dang" ]; then
    canh_bao "Không đọc được phiên bản three đã cài — bỏ qua mục so phiên bản."
  elif [ -n "$can_so" ] && [ "$can_so" != "$dang" ]; then
    canh_bao "Phiên bản three LỆCH: package.json cần \"$can\", máy đang có \"$dang\"."
    echo "   ⇒ Nên chạy: npm install --legacy-peer-deps" | tee -a "$RA"
  else
    dat "Phiên bản three — khớp ($dang)"
  fi

  # ── 4. Chromium/Chrome ────────────────────────────────────────────────────────────────────
  # ⚠️ HỎI `city-preview.mjs`, KHÔNG chép danh sách đường dẫn sang đây. Danh sách ấy
  # (`CHROME_CANDIDATES`) đã có sẵn ĐÚNG MỘT chỗ; chép sang chỗ thứ hai là đúng cái bẫy "một luật
  # hai công thức" đã làm `sweep-score.mjs` bịa ra nguyên một bộ số ở Phase 4G.
  local chrome_ra chrome_ma
  chrome_ra="$(node scripts/city-preview.mjs --kiem-chromium 2>&1)"
  chrome_ma=$?
  if [ "$chrome_ma" -ne 0 ]; then
    {
      echo "❌ Không tìm thấy trình duyệt Chromium/Chrome để dựng ảnh."
      printf '%s\n' "$chrome_ra" | sed 's/^/   /'
    } | tee -a "$RA"
    SO_LOI=$((SO_LOI + 1))
    return 1
  fi
  dat "Chromium — $chrome_ra"

  # ── 5. ghi được vào .city-preview/ không (quyền + dung lượng đĩa) ──────────────────────────
  if ! mkdir -p .city-preview 2>/dev/null; then
    loi "Không tạo được thư mục \`.city-preview\` (thiếu quyền ghi ở đây?)." \
        "" \
        "Kiểm xem thư mục dự án có bị khoá chỉ-đọc không, rồi thử lại."
    return 1
  fi
  if ! : > ".city-preview/.thu-ghi" 2>/dev/null; then
    loi "Không ghi được file vào \`.city-preview/\`." \
        "" \
        "Kiểm quyền ghi của thư mục rồi thử lại."
    return 1
  fi
  rm -f ".city-preview/.thu-ghi"
  # `df -Pk` cho định dạng POSIX ổn định trên cả macOS lẫn Linux (cột 4 = KB còn trống).
  local con_mb
  con_mb="$(df -Pk . 2>/dev/null | awk 'NR==2 {print int($4/1024)}' || true)"
  if [ -n "$con_mb" ] && [ "$con_mb" -lt "$DIA_TOI_THIEU_MB" ] 2>/dev/null; then
    canh_bao "Đĩa còn ít (${con_mb} MB). Bộ đo cần khoảng ${DIA_TOI_THIEU_MB} MB cho bundle + ảnh."
  else
    dat "Ghi được vào .city-preview/ — đĩa còn ${con_mb:-?} MB"
  fi

  # ── 6. cây git sạch không, đang ở nhánh nào (CẢNH BÁO, không chặn) ─────────────────────────
  # Bẩn không làm số đo SAI, nhưng làm nó KHÔNG ỨNG VỚI COMMIT NÀO CẢ — tức sau này không ai tái
  # lập được. Đúng bài học `TECH_DEBT #18`: một con số nghiệm thu phải đi kèm thứ đã đo ra nó.
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    local nhanh ban
    nhanh="$(git branch --show-current 2>/dev/null || true)"
    # ⚠️ TRỪ CHÍNH THƯ MỤC KẾT QUẢ CỦA MÌNH RA. Script ghi `$RA` vào `.city-preview/` TRƯỚC khi
    # preflight chạy, nên nếu không lọc thì nó tự tố cáo sản phẩm của chính nó là "thay đổi chưa
    # lưu". Trong kho thật điều đó bị `.gitignore` che đi — tức lời cảnh báo này đang đúng NHỜ một
    # file chẳng liên quan, đúng hình dạng quả mìn. Và một cảnh báo kêu oan thì tệ hơn không có:
    # nó dạy người dùng bỏ qua MỌI cảnh báo. (Phát hiện lúc thử ngược mục 6 ở kho git tạm.)
    ban="$(git status --porcelain 2>/dev/null | grep -v '^?? \.city-preview/' | head -n 5 || true)"
    if [ -n "$ban" ]; then
      canh_bao "Cây git có thay đổi CHƯA LƯU — số đo sẽ không ứng với commit nào cả."
      {
        printf '%s\n' "$ban" | sed 's/^/      /'
        echo "   ⇒ Cân nhắc gõ:  git stash"
      } | tee -a "$RA"
    else
      dat "Cây git — sạch"
    fi
    echo "   nhánh: ${nhanh:-(không ở nhánh nào)} · commit: $(git rev-parse --short HEAD 2>/dev/null || echo '?')" | tee -a "$RA"
  else
    canh_bao "Không phải kho git — không ghi lại được commit nào đã sinh ra bộ số này."
  fi

  echo "──────────────────────────────────────────────────────────────────" | tee -a "$RA"
  return 0
}

# ── Chạy MỘT cảnh. Trả về 0 nếu ổn, 1 nếu hỏng. In các dòng [bench]/[stats] ra màn hình + file. ──
# $1 = nhãn cảnh · $2 = số khung · $3 = bề rộng · $4 = bề cao · $5.. = cờ thêm
TEN_CARD=""
chay_canh() {
  local nhan="$1" khung="$2" rong="$3" cao="$4"
  shift 4
  local tam ma dong loc tong_dong
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
    # ⚠️ IN CẢ ĐẦU LẪN CUỐI, VÀ ĐẦU TRƯỚC. Bản cũ chỉ `tail -n 20` (giữ 20 dòng CUỐI) và đã vứt
    # mất đúng manh mối duy nhất: hôm 2026-08-17 nguyên nhân thật là dòng
    #     "Rolldown failed to resolve import 'three' from ..."
    # nằm ở ĐẦU đầu ra, còn 20 dòng cuối toàn `at viteLog (...)`. Với lỗi build thì NGUYÊN NHÂN
    # luôn ở đầu và NGĂN XẾP ở cuối — giữ mỗi cuối là giữ đúng phần vô dụng. Đàm đã phải tự chạy
    # một lệnh khác mới nhìn thấy dòng ấy.
    #
    # Lọc bỏ dòng ngăn xếp thuần (`    at ...`) khỏi phần TRÍCH, nhưng KHÔNG lọc khỏi file log —
    # ngăn xếp vẫn cần khi phải soi sâu, chỉ là nó không được dìm mất phần đọc được.
    {
      echo "=================================================================="
      echo "CẢNH HỎNG: $nhan"
      echo "mã thoát của node = $ma"
      echo "=================================================================="
      cat "$tam"
      echo ""
    } >> "$LOG_LOI"

    loc="$(grep -vE '^[[:space:]]+at ' "$tam" | grep -vE '^[[:space:]]*$' || true)"
    tong_dong="$(printf '%s\n' "$loc" | grep -c . || true)"

    {
      echo "!!! CẢNH NÀY HỎNG — $nhan"
      echo "!!! mã thoát của node = $ma; số dòng đo lấy được = $(printf '%s' "$dong" | grep -c . || true)"
      echo "!!!"
      echo "!!! ↓↓↓ NGUYÊN NHÂN thường nằm ở ĐÂY (những dòng ĐẦU của đầu ra) ↓↓↓"
      if [ "$tong_dong" -le 23 ]; then
        printf '%s\n' "$loc" | sed 's/^/!!!   /'
      else
        printf '%s\n' "$loc" | head -n 15 | sed 's/^/!!!   /'
        echo "!!!   … (bỏ qua $((tong_dong - 23)) dòng giữa) …"
        echo "!!! ↓↓↓ KẾT CỤC (những dòng CUỐI) ↓↓↓"
        printf '%s\n' "$loc" | tail -n 8 | sed 's/^/!!!   /'
      fi
      echo "!!!"
      echo "!!! Đầu ra ĐẦY ĐỦ (có cả ngăn xếp) nằm ở: $PWD/$LOG_LOI"
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

# ══════════════════════════ MỞ SỔ + PREFLIGHT (CHUNG CHO CẢ HAI CHẾ ĐỘ) ══════════════════════
mkdir -p .city-preview 2>/dev/null || true
: > "$RA"
: > "$LOG_LOI"

if [ "$THU" -eq 1 ]; then
  echo "=== THỬ NHANH — kiểm máy rồi chạy 1 cảnh ===" | tee -a "$RA"
else
  echo "=== BỘ ĐO HIỆU NĂNG THÀNH PHỐ 3D ===" | tee -a "$RA"
fi
echo "máy: $(uname -s) $(uname -m)" | tee -a "$RA"
echo "" | tee -a "$RA"

if ! kiem_moi_truong; then
  {
    echo ""
    echo "❌ DỪNG — máy chưa sẵn sàng ($SO_LOI mục không đạt). Chưa chạy cảnh nào cả."
    echo "   Làm đúng lệnh in ở trên rồi chạy lại:  bash scripts/bench-macbook.sh --thu"
  } | tee -a "$RA"
  exit 1
fi
[ "$SO_CANH_BAO" -gt 0 ] && echo "(có $SO_CANH_BAO cảnh báo ở trên — vẫn chạy được)" | tee -a "$RA"
echo "" | tee -a "$RA"

# Mối nối cho bài test: dừng ngay sau preflight, khỏi đợi gói bundle.
if [ "$CHI_KIEM" = "1" ]; then
  echo "✅ PREFLIGHT XONG (BENCH_CHI_KIEM=1 nên dừng ở đây, không chạy cảnh)." | tee -a "$RA"
  exit 0
fi

# ══════════════════════ KỶ NẶNG NHẤT — HỎI, ĐỪNG VIẾT CỨNG ══════════════════════
# ⚠️ Đàm yêu cầu ma trận phải gồm "cảnh nặng nhất hiện tại (kỷ nhiều tam giác nhất, 22h có đèn,
# khung lớn)" — vì đó mới là chỗ ngân sách cạn TRƯỚC. Nhưng "kỷ nhiều tam giác nhất" là một QUAN
# HỆ, không phải một con số: hôm nay là kỷ 14 (179.182 tam giác), và mọi phase thêm chi tiết đều
# có thể đổi nó. Viết cứng `--era 14` vào đây là đúng cái bẫy đã cắn nhiều lần trong dự án — một
# hằng số không nhìn thấy thứ nó đang được so với.
#
# `scene-count.mjs` là hàm THUẦN (duyệt scene graph, KHÔNG cần Chromium, ~10 giây) nên hỏi nó là
# rẻ. Nó in TSV: kỷ \t nước \t tam giác \t lệnh vẽ.
# ⚠️ Số tam giác KHÔNG phụ thuộc giờ (đã đo: kỷ 1 ra 123.840 ở cả 12h lẫn 22h — đèn là chi phí
# ÁNH SÁNG, không phải hình học), nên hỏi ở giờ mặc định là đủ.
KY_NANG=""
TAMGIAC_NANG=""
tim_ky_nang() {
  local ra
  ra="$(KHO="$PWD" node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs 2>/dev/null \
        | awk -F'\t' 'NF>=3 && $1 ~ /^[0-9]+$/ { if ($3+0 > m) { m = $3+0; k = $1 } } END { if (k != "") print k, m }')"
  if [ -z "$ra" ]; then
    return 1
  fi
  KY_NANG="${ra%% *}"
  TAMGIAC_NANG="${ra##* }"
  return 0
}

# ══════════════════════════ CHẾ ĐỘ THỬ — ĐÚNG 1 CẢNH ══════════════════════════
if [ "$THU" -eq 1 ]; then
  echo "Máy đã sẵn sàng. Giờ thử dựng 1 cảnh (~20 giây)…" | tee -a "$RA"
  echo "cửa sổ ${RONG}×${CAO}" | tee -a "$RA"
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

# ══════════════════════════ CHẠY THẬT — MA TRẬN 24 CẢNH + 2 ══════════════════════════
# Hỏi TRƯỚC khi chạy cảnh nào, để phần mô tả ma trận tự khai nó sắp đo kỷ nào và vì sao.
if tim_ky_nang; then
  echo "kỷ NẶNG NHẤT hiện tại (đo bằng scene-count.mjs, không viết cứng): kỷ ${KY_NANG} — ${TAMGIAC_NANG} tam giác" | tee -a "$RA"
else
  KY_NANG=14
  TAMGIAC_NANG="(không đọc được)"
  echo "⚠ KHÔNG hỏi được scene-count.mjs — dùng tạm kỷ ${KY_NANG}. Cảnh nặng nhất bên dưới CÓ THỂ" | tee -a "$RA"
  echo "  không phải kỷ nặng nhất thật. Báo lại cho AI, đừng đọc dòng ấy như một cái trần." | tee -a "$RA"
fi
echo "" | tee -a "$RA"

echo "ma trận: kỷ 3/7/11/14 × giờ 12/15/22 × zoom 1 và 0.4 = 24 cảnh, TẤT CẢ ở cửa sổ ${RONG}×${CAO}" | tee -a "$RA"
echo "cộng 1 cảnh ĐỐI CHIẾU ĐIỂM ẢNH ở ${RONG_LON}×${CAO_LON} (kỷ 7 · 12 giờ — cùng cấu hình với một dòng ở trên)" | tee -a "$RA"
echo "cộng 1 cảnh NẶNG NHẤT ở ${RONG_LON}×${CAO_LON} (kỷ ${KY_NANG} · 22 giờ · đèn bật) — chỗ ngân sách cạn TRƯỚC" | tee -a "$RA"
echo "mỗi cảnh $KHUNG khung hình · --sessions 80 --level 3 · DPR đúng như app" | tee -a "$RA"
echo "" | tee -a "$RA"

DAT=0
NANG_DAT=0
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

      # Cổng card: kiểm NGAY SAU cảnh đầu tiên. Chạy hết 26 cảnh rồi mới phát hiện dùng CPU
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

# ── Cảnh NẶNG NHẤT: kỷ nhiều tam giác nhất × 22 giờ (đèn bật) × cửa sổ LỚN. ─────────────────
# ⚠️ VÌ SAO CẢNH NÀY PHẢI CÓ, VÀ VÌ SAO NÓ KHÔNG NẰM TRONG MA TRẬN 24 CẢNH. Ma trận chạy TẤT CẢ ở
# cửa sổ ${RONG}×${CAO}, còn cảnh đối chiếu điểm ảnh ở cửa sổ lớn lại dùng kỷ 7 · 12 giờ — tức
# đúng góc NHẸ NHẤT của cả bộ (12 giờ = chưa bật đèn). Ba trục đắt nhất theo PERFORMANCE.md là
# ĐIỂM ẢNH (80% chi phí) · ÁNH SÁNG (bật đèn 22h = +19%) · và hình học (gần như miễn phí). Cảnh
# này là chỗ DUY NHẤT cả ba trục cùng ở mức cao nhất, nên nó là chỗ ngân sách cạn TRƯỚC — và đó
# đúng là con số cần biết trước khi tiêu một mili-giây nào vào hiệu ứng.
nhan_nang="kỷ $KY_NANG · 22 giờ (đèn bật) · góc rộng (zoom 1) · cửa sổ ${RONG_LON}×${CAO_LON} — CẢNH NẶNG NHẤT"
echo "### $nhan_nang" | tee -a "$RA"
echo "### (kỷ nhiều tam giác nhất = $TAMGIAC_NANG tam giác; 22 giờ là chặng DUY NHẤT có đèn;" | tee -a "$RA"
echo "###  $((RONG_LON * CAO_LON)) điểm ảnh CSS. Đây là chỗ ngân sách cạn trước, không phải trung bình.)" | tee -a "$RA"
if chay_canh "$nhan_nang" "$KHUNG" "$RONG_LON" "$CAO_LON" --era "$KY_NANG" --hour 22 --zoom 1; then
  NANG_DAT=1
else
  NANG_DAT=0
fi
echo "" | tee -a "$RA"

# ── Tổng kết: nói RÕ đã chạy được bao nhiêu. Thiếu thì phải kêu to. ──────────────────────────
{
  echo "════════════════════════════════════════════════════════════════"
  echo "ĐÃ CHẠY ĐƯỢC $DAT/$TONG cảnh của ma trận (cửa sổ ${RONG}×${CAO})"
  if [ "$LON_DAT" -eq 1 ]; then
    echo "cộng cảnh đối chiếu điểm ảnh ở ${RONG_LON}×${CAO_LON}: ĐẠT"
  else
    echo "!!! cảnh đối chiếu điểm ảnh ở ${RONG_LON}×${CAO_LON}: HỎNG"
  fi
  if [ "$NANG_DAT" -eq 1 ]; then
    echo "cộng cảnh NẶNG NHẤT (kỷ $KY_NANG · 22 giờ · ${RONG_LON}×${CAO_LON}): ĐẠT"
  else
    echo "!!! cảnh NẶNG NHẤT (kỷ $KY_NANG · 22 giờ · ${RONG_LON}×${CAO_LON}): HỎNG"
    echo "!!! Thiếu đúng cảnh quan trọng nhất — KHÔNG kết luận được còn bao nhiêu ms để tiêu."
  fi
  echo "máy đồ hoạ: ${TEN_CARD:-(không đọc được)}"
  if [ "$DAT" -ne "$TONG" ] || [ "$LON_DAT" -ne 1 ] || [ "$NANG_DAT" -ne 1 ]; then
    echo ""
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!! THIẾU $((TONG - DAT)) CẢNH CỦA MA TRẬN. Bảng số này CHƯA ĐỦ để kết luận."
    echo "!!! Tìm chữ \"CẢNH NÀY HỎNG\" trong file để biết cảnh nào chết và vì sao."
    echo "!!! Đầu ra đầy đủ của các cảnh hỏng: $PWD/$LOG_LOI"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  else
    echo "✅ đủ cảnh."
  fi
  echo "⚠️ Mọi kết luận về dư địa rút ra từ file này chỉ đúng cho CỬA SỔ ${RONG}×${CAO}"
  echo "   (và hai dòng cửa sổ lớn cho ${RONG_LON}×${CAO_LON}). Đổi cỡ cửa sổ là đổi bài toán."
  echo ""
  echo "──────────────────── CÁCH ĐỌC BẢNG NÀY (đọc trước khi trích số) ────────────────────"
  echo "Trần làm việc 8 ms mỗi khung được định nghĩa ở KHUNG MẶC ĐỊNH ${RONG}×${CAO}. Cảnh"
  echo "NẶNG NHẤT lại chạy ở ${RONG_LON}×${CAO_LON} — nhiều điểm ảnh hơn — nên số ms của nó"
  echo "KHÔNG đem so thẳng với 8 ms được. Hai con số ấy trả lời hai câu hỏi khác nhau."
  echo ""
  echo "  · CÒN BAO NHIÊU MS ĐỂ TIÊU  → đọc dòng (a) P50 của cảnh CHẬM NHẤT trong 24 cảnh ở"
  echo "    ${RONG}×${CAO}, rồi lấy 8 trừ đi. Đó là ngân sách cho mọi hiệu ứng thêm vào."
  echo "  · CHI PHÍ THEO ĐIỂM ẢNH     → so hai dòng kỷ 7 · 12 giờ · zoom 1 ở hai cỡ cửa sổ."
  echo "    Chúng khác nhau ĐÚNG một thứ là số điểm ảnh, nên hiệu số của chúng là độ dốc."
  echo "  · CHỖ CẠN TRƯỚC             → dòng CẢNH NẶNG NHẤT. Nó cho biết thứ tự các trục đắt,"
  echo "    không cho biết dư địa ở khung mặc định."
  echo ""
  echo "⚠️ ĐỪNG hạ DPR để lấy lại ms — đó là bán đúng thứ đang muốn mua (lệnh Đàm 2026-08-20)."
  echo "⚠️ iPhone CHƯA từng được đo (TECH_DEBT #23/#26). Đừng suy bất cứ gì từ bảng này sang iPhone."
  echo "════════════════════════════════════════════════════════════════"
  echo "=== XONG — gửi lại file $RA ==="
} | tee -a "$RA"

[ "$DAT" -eq "$TONG" ] && [ "$LON_DAT" -eq 1 ]
