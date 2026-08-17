#!/bin/bash
# ĐO HIỆU NĂNG THÀNH PHỐ 3D TRÊN MACBOOK THẬT — Performance Gate.
#
# Chạy đúng ma trận nghiệm thu: kỷ 3/7/11/14 × giờ 12/15/22 × góc rộng (zoom 1) và góc gần
# (zoom 0.4) = 24 cảnh, mỗi cảnh 120 khung hình, ở ĐÚNG DPR mà app dùng (không truyền --dpr).
#
# ⚠️ VÌ SAO PHẢI CHẠY TRÊN MÁY ĐÀM: hộp cát nơi AI làm việc không có card đồ hoạ — WebGL ở đó chạy
# bằng SwiftShader (tô hình bằng CPU), chậm hơn khoảng ba bậc VÀ tốn tiền ở chỗ khác. Mọi con số
# FPS đo ở đó đều vô nghĩa với câu hỏi "MacBook chịu được bao nhiêu".
#
# ⚠️ TỰ KIỂM: dòng đầu tiên của mỗi cảnh in ra TÊN MÁY ĐỒ HOẠ. Nếu nó có chữ "SwiftShader" hoặc
# "Software" thì trình duyệt đã KHÔNG dùng card thật và cả bảng số phải vứt đi — đừng đọc tiếp.
# Trên Mac nó phải hiện tên card thật (ví dụ "Apple M2" / "ANGLE (Apple, ANGLE Metal Renderer...)").
#
# Cách dùng: mở Terminal, cd vào thư mục dự án, rồi:
#     bash scripts/bench-macbook.sh
# Kết quả vừa hiện trên màn hình vừa được ghi vào .city-preview/bench-macbook.txt — gửi lại file đó.
set -u

RA=".city-preview/bench-macbook.txt"
mkdir -p .city-preview
: > "$RA"

echo "=== BỘ ĐO HIỆU NĂNG THÀNH PHỐ 3D ===" | tee -a "$RA"
echo "máy: $(uname -s) $(uname -m)" | tee -a "$RA"
echo "" | tee -a "$RA"

for e in 3 7 11 14; do
  for h in 12 15 22; do
    for z in 1 0.4; do
      goc="rộng"; [ "$z" != "1" ] && goc="gần"
      echo "### kỷ $e · ${h} giờ · góc $goc (zoom $z)" | tee -a "$RA"
      # 2>&1 vì dòng [bench] đi qua stderr của Chromium; grep lọc bỏ tiếng ồn của trình duyệt.
      node scripts/city-preview.mjs \
        --era "$e" --hour "$h" --zoom "$z" \
        --sessions 80 --level 3 \
        --bench 120 --gpu 2>&1 \
        | grep -oE '\[bench\][^"]*|\[stats\][^"]*' | tee -a "$RA"
      echo "" | tee -a "$RA"
    done
  done
done

echo "=== XONG — gửi lại file $RA ===" | tee -a "$RA"
