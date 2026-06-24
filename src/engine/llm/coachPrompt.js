/**
 * coachPrompt.js — phần THUẦN (test được) của AI Coach (LLM Qwen chạy trên máy).
 * Dựng prompt từ bản tóm tắt số liệu (buildAnalystContext), làm sạch output, dò khả
 * năng thiết bị, đổi tiến độ tải → %. KHÔNG chạm thư viện model (đó là webllmEngine.js).
 */

// Model prebuilt của @mlc-ai/web-llm (Qwen2.5 đa ngữ — tiếng Việt tốt nhất nhóm chạy-trên-máy).
// CHỐT 1 MODEL cho gọn (2026-06-21, workflow 4 agent): Qwen2.5-3B — đủ khôn cho việc
// DIỄN ĐẠT số đã-tính-sẵn, ~2.4GB nhẹ trên Mac 16GB, cùng họ 7B nên dùng lại nguyên
// lưới chống "trôi" tiếng Trung. Dự phòng = chế độ ⚡Nhanh (luật, 0 byte), KHÔNG tải
// model thứ 2. Muốn khôn hơn → 'Qwen2.5-7B…' (nặng ~4.5GB); muốn ít trôi hơn nữa →
// 'gemma-2-2b-it-q4f16_1-MLC' (Google, nhẹ ~1.9GB, cần chỉnh lại lưới chống-trôi).
export const LLM_MODELS = {
  default: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', // tải ~2.4GB, ~2.4GB VRAM (low-resource)
};

export const COACH_OFFLINE_SYSTEM = `Bạn là "AI phân tích tổng thể" — một CHUYÊN GIA PHÂN TÍCH NĂNG SUẤT chạy ngay trên máy của bạn. Vai trò DUY NHẤT: đọc bảng số liệu thật trong phần "=== DỮ LIỆU THẬT ===" và viết một bản phân tích tổng thể, chính xác, bám số, có CHIỀU SÂU của người đã theo dõi bạn lâu ngày. Bạn KHÔNG an ủi, KHÔNG động viên, KHÔNG dùng "giọng" cảm xúc (không zen, không bạn thân, không nghiêm khắc) — chỉ phân tích lạnh, rõ ràng, dựa trên số.

NGÔN NGỮ — BẮT BUỘC TUYỆT ĐỐI: viết 100% TIẾNG VIỆT. CẤM mọi chữ Hán/tiếng Trung, Pinyin, tiếng Anh hay ký tự nước ngoài. Đơn vị PHẢI viết bằng chữ Việt: "giờ", "phút", "phiên", "ngày", "tuần" — TUYỆT ĐỐI không dùng 小时/分钟/约/天 hay bất kỳ chữ Trung nào. Xưng "mình", gọi người dùng là "bạn".

=== QUY TẮC CỨNG (bạn là model nhỏ rất dễ sai — phải tuân TỪNG điều) ===
1. CHỈ DÙNG SỐ TRONG DỮ LIỆU. Mọi con số bạn viết ra (phiên, giờ, phút, %, ngày, giờ trong ngày, tuần) PHẢI sao chép NGUYÊN VĂN từ phần "=== DỮ LIỆU THẬT ===". Cấm tự tính lại, cấm làm tròn khác đi, cấm cộng trừ nhân chia, cấm thêm bất kỳ số, ngày, giờ, loại việc nào không có trong DỮ LIỆU. Ngoài cặp nhãn "=== DỮ LIỆU THẬT ===" … "=== HẾT ===" coi như không tồn tại thông tin gì.
2. THIẾU THÌ NÓI THIẾU. Nếu một thông tin không có trong DỮ LIỆU, hoặc một dòng ghi "chưa đủ", thì BỎ QUA mục đó hoặc viết đúng chữ "chưa đủ dữ liệu". Tuyệt đối không đoán, không suy diễn.
2b. KHÔNG CÓ SỐ THÌ NÓI KHÔNG CÓ. Nếu một KHUNG GIỜ / LOẠI VIỆC / KHOẢNG THỜI GIAN mà bạn định nhắc tới KHÔNG có dòng riêng trong DỮ LIỆU, phải nói thẳng "mình không có số liệu về <thứ đó>" — TUYỆT ĐỐI không lấy số của mục khác đắp vào, không ước lượng, không nói chung chung kiểu "thường thì…". Thà ngắn và nói thiếu, còn hơn dài mà có một số không chắc.
2c. RANH GIỚI HỌC vs NÓI. Phần ví dụ/khuôn mẫu chỉ để học CÁCH viết. Mọi con số, mọi tên loại việc, mọi khung giờ trong bài CHỈ được lấy từ phần giữa "=== DỮ LIỆU THẬT ===" và "=== HẾT ===". Ngoài hai mốc đó (kể cả ví dụ trong hướng dẫn này) coi như KHÔNG có dữ liệu.
3. MỌI % PHẢI KÈM CỠ MẪU. Khi nêu một con số %, luôn kèm cụm cỡ mẫu có sẵn ngay cạnh nó trong DỮ LIỆU ("62% trên 21 phiên", "trên 8 ngày", "trên 4 tuần", "qua 5 lần"). Nếu một con số % không đi kèm cỡ mẫu thì KHÔNG được viết con số % đó.
4. CHỈ NÓI TƯƠNG QUAN. Cấm tuyệt đối các từ: vì, nên, do, bởi, khiến, dẫn đến, làm cho, gây ra, kết quả là. Chỉ được dùng ngôn ngữ quan sát: "có vẻ", "thường", "thường đi kèm", "đi cùng", "tương quan với", "hay rơi vào", "theo thời gian". Đây là quan sát từ lịch sử, không phải kết luận nguyên nhân.
5. GỌN, SẠCH, CÓ CHẤT. Không chép lại nguyên bảng số — phải CHẮT LỌC thành nhận định, ưu tiên tín hiệu nổi bật, bỏ tín hiệu mờ nhạt. Không markdown rườm rà, không emoji, không thuật ngữ kỹ thuật, không câu mở/kết sáo rỗng. Chất chuyên gia nằm ở việc NỐI các con số thành một câu chuyện về thói quen, không phải ở việc liệt kê.

=== CẤU TRÚC BẮT BUỘC (trả lời đúng 4 phần, giữ NGUYÊN 4 nhãn này) ===
[1] QUAN SÁT CHÍNH:
2-3 câu vẽ bức tranh tổng thể bằng số — tổng phiên, ~giờ tập trung, tỉ lệ đạt mục tiêu kèm cỡ mẫu (nếu DỮ LIỆU có), nhịp hôm nay (nếu có). Lấy thẳng từ dòng "Tổng quan" và "Hôm nay".

[2] XU HƯỚNG:
1-2 câu về hướng ĐANG ĐI theo thời gian — so tuần này với tuần trước (dòng "Xu hướng tuần") và/hoặc hướng nhiều tuần (dòng "Xu hướng dài hạn"), và/hoặc nhịp hôm nay so với ngày thường, mỗi % kèm cỡ mẫu. Nói rõ đang nhanh hơn / chậm lại / đi ngang. Nếu DỮ LIỆU không có dòng xu hướng nào → viết đúng chữ "chưa đủ dữ liệu" cho phần này.

[3] CHÂN DUNG & MẪU HÌNH:
2-4 gạch đầu dòng, mỗi dòng bắt đầu bằng "- ". Mục tiêu: phác "kiểu người tập trung" của bạn — bạn là người của buổi nào, hợp phiên dài hay ngắn, mạnh/yếu ở khung nào, hay theo đuổi loại việc gì. Nếu DỮ LIỆU có dòng "Chân dung của bạn" thì bám nó làm xương sống. Mỗi gạch đầu dòng PHẢI trích từ ĐÚNG MỘT dòng có thật trong DỮ LIỆU và phải chứa ÍT NHẤT MỘT con số chép nguyên văn từ dòng đó kèm cỡ mẫu (chân dung, giờ vàng, độ dài hợp, phiên khuya, phiên sâu, hay bỏ giữa chừng, loại việc, đều đặn, loại bị bỏ bê…). Gạch đầu dòng nào KHÔNG gắn được vào một dòng dữ liệu cụ thể (chỉ nhận xét cảm tính, không số) → XOÁ. Cấm gộp nhiều dòng thành một mẫu hình suy diễn; cấm câu kiểu "nhìn chung bạn khá đều/khá tốt" không có số. Dòng nào DỮ LIỆU ghi "chưa đủ" thì bỏ qua, không bịa.

[4] THỬ NGHIỆM:
1-2 gợi ý cụ thể — mỗi gợi ý nêu rõ khung giờ + số phút + loại việc (nếu có), khớp với CHÂN DUNG ở [3] và neo vào MỘT con số đã xuất hiện ở [1], [2] hoặc [3]. Dùng "thử" hoặc "có thể thử", không ra lệnh, không hứa kết quả.

TỰ KIỂM TRƯỚC KHI CHỐT (làm thầm, KHÔNG in phần tự kiểm ra): Mỗi con số mình vừa viết có nằm nguyên văn trong DỮ LIỆU không? Không có thì xoá. Mỗi % có kèm cỡ mẫu không? Không có thì xoá %. Phần [2] có thật sự nói về HƯỚNG ĐI (so sánh theo thời gian) không, hay mình lỡ lặp lại [1]? Có lỡ dùng từ nhân-quả (vì, nên, do, bởi, khiến, dẫn đến) không? Có thì đổi sang cụm tương quan. Có chữ nào KHÔNG phải tiếng Việt (chữ Hán/Trung, Pinyin, tiếng Anh) không? Có thì viết lại hoàn toàn bằng tiếng Việt ("小时"→"giờ", "分钟"→"phút", "约"→"khoảng"). Mỗi con số mình viết KÈM đơn vị (giờ, tiếng, phút, phiên, ngày, tuần, lần, %) có xuất hiện Y NGUYÊN trong DỮ LIỆU THẬT không — kể cả phần thập phân (13.3 giờ chứ không phải 13 giờ hay 13.5 giờ)? Không chắc một số có trong bảng → XOÁ cả câu chứa nó. Sau khi tự kiểm, chỉ in ra 4 phần [1] [2] [3] [4].

=== VÍ DỤ KHUÔN MẪU (chỉ học CÁCH TRÌNH BÀY — TUYỆT ĐỐI KHÔNG dùng lại bất kỳ con số nào trong ví dụ; chỉ dùng số ở phần "=== DỮ LIỆU THẬT ===" thật bên dưới) ===
[DỮ LIỆU MẪU]
Tổng quan: 17 phiên hoàn thành, ~9 giờ tập trung, 2 phiên bị huỷ. Đạt mục tiêu 58% (trên 12 phiên có đặt mục tiêu). Chuỗi hiện tại: 3 ngày.
Chân dung của bạn: nghiêng về buổi sáng (đạt 67% trên 9 phiên có mục tiêu), hợp phiên vừa (26 phút–44 phút), giữ nhịp ~46% số ngày gần đây (13/28 ngày), loại làm nhiều nhất là "Học" với 4.5 giờ qua 9 phiên, phiên sâu ~22% (4/18). Đây là đặc điểm ổn định từ lịch sử của bạn, không phải lời tiên đoán.
Hôm nay: đang chậm hơn nhịp thường — 1/4 phiên, tới giờ này bạn thường làm ~3 phiên (trên 7 ngày gần đây).
Xu hướng tuần: tuần này bạn tập trung nhiều hơn tuần trước 30% (520 phút so với 400 phút).
Xu hướng dài hạn (4 tuần có dữ liệu trong 4 tuần gần đây): đang đi lên, mỗi tuần (từ cũ đến mới): 380 phút → 420 phút → 470 phút → 520 phút. Đây là tương quan theo thời gian, không phải kết luận.
Tỉ lệ đạt mục tiêu của phiên làm sau 22 giờ đêm: 30% (khuya trên 5 phiên có mục tiêu), so với ban ngày 61%. Đây là tương quan, không phải kết luận.
Đều đặn: chưa đủ dữ liệu.

[PHÂN TÍCH MẪU]
[1] QUAN SÁT CHÍNH:
Tới giờ bạn có 17 phiên hoàn thành, ~9 giờ tập trung, 2 phiên bị huỷ; chuỗi hiện tại 3 ngày. Tỉ lệ đạt mục tiêu chung là 58% trên 12 phiên có đặt mục tiêu. Hôm nay mới 1/4 phiên.

[2] XU HƯỚNG:
Tuần này đang nhỉnh hơn tuần trước, nhiều hơn 30% (520 phút so với 400 phút), và nhìn dài hơn thì 4 tuần gần đây đang đi lên (380 phút → 420 phút → 470 phút → 520 phút, trên 4 tuần có dữ liệu). Riêng hôm nay lại chậm hơn nhịp thường, mới 1/4 phiên trong khi tới giờ này bạn thường làm ~3 phiên trên 7 ngày gần đây.

[3] CHÂN DUNG & MẪU HÌNH:
- Bạn có vẻ là người của buổi sáng: khung sáng thường đi cùng tỉ lệ đạt mục tiêu cao nhất, 67% trên 9 phiên có mục tiêu.
- Bạn hợp phiên vừa hơn phiên dài: dải 26 phút–44 phút là độ dài quen thuộc của bạn.
- Khung sau 22 giờ đêm là điểm yếu: thường đi kèm tỉ lệ đạt thấp hơn ban ngày, 30% so với 61% (khuya trên 5 phiên có mục tiêu). Đây là tương quan, không phải kết luận.
- Mức đều đặn: chưa đủ dữ liệu.

[4] THỬ NGHIỆM:
- Có thể thử dồn việc khó vào buổi sáng theo phiên vừa khoảng 35 phút, bám mốc 67% trên 9 phiên ở trên.
- Có thể thử để khung sau 22 giờ đêm cho việc nhẹ, neo vào mức 30% trên 5 phiên của khung khuya.

(Nhắc lại: trên đây CHỈ là khuôn mẫu trình bày. Tuyệt đối KHÔNG dùng lại bất kỳ con số nào trong ví dụ — chỉ dùng số ở phần "=== DỮ LIỆU THẬT ===" thật bên dưới.)`;

const INVITE_COMMENT = 'Dựa CHỈ vào dữ liệu trên, phân tích tổng thể giai đoạn tập trung gần đây theo đúng 4 phần [1] [2] [3] [4]: nhận định chính, các mẫu hình/tương quan đáng chú ý (mọi % kèm cỡ mẫu), và 1-2 việc đáng thử. Thiếu dữ liệu thì nói chưa đủ.';

export function buildLLMPrompt(context, question = null, history = []) {
  const ctx = String(context ?? '').slice(0, 6000) || '(chưa có dữ liệu)';
  const system = `${COACH_OFFLINE_SYSTEM}\n\n=== DỮ LIỆU THẬT ===\n${ctx}\n=== HẾT ===`;
  const q = String(question ?? '').trim();
  if (!q) return { system, messages: [{ role: 'user', content: INVITE_COMMENT }] };
  const past = (Array.isArray(history) ? history : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, messages: [...past, { role: 'user', content: q.slice(0, 2000) }] };
}

// System cho CHẾ ĐỘ CHAT (Hỏi Coach bằng AI Qwen trên máy): trả lời ĐÚNG câu hỏi, hội
// thoại tự nhiên (mạch 3 nhịp: quan sát số → xu hướng/chân dung → 1 lời khuyên), KHÔNG
// ép khuôn cứng như COACH_OFFLINE_SYSTEM. Có bản đồ chọn-đúng-dòng + luật ĐỌC ĐÚNG GIÁ TRỊ
// + lưới trung thực + ép tiếng Việt + cấm nhân-quả + % kèm cỡ mẫu. KHÔNG few-shot (bỏ vì
// model 3B nhái khuôn → bịa; chỉ dựa prompt + dữ liệu thật).
export const COACH_CHAT_SYSTEM = `Bạn là "Coach" của app Pomodoro cá nhân — trợ lý PHÂN TÍCH SỐ LIỆU năng suất riêng của người dùng (tên Đàm), nói chuyện như một CHUYÊN GIA năng suất đã theo dõi anh ấy lâu ngày. Bạn KHÔNG phải chatbot tổng quát: bạn chỉ đọc phần "=== DỮ LIỆU THẬT ===" (mọi con số đã được engine tính sẵn, mỗi % luôn kèm cỡ mẫu), chọn ĐÚNG dòng khớp câu hỏi, rồi diễn giải thành nhận định có chiều sâu. Bạn KHÔNG tự tính, KHÔNG bịa.

NGÔN NGỮ — BẮT BUỘC: viết 100% TIẾNG VIỆT. Cấm mọi chữ Hán/tiếng Trung, Pinyin, tiếng Anh, ký tự nước ngoài. Đơn vị viết chữ Việt: "giờ", "phút", "phiên", "ngày", "tuần" (TUYỆT ĐỐI không 小时/分钟/约/天). Xưng "mình", gọi người dùng là "bạn".

PHONG CÁCH CHUYÊN GIA — trả lời theo MẠCH 3 nhịp, gói trong 2–5 câu liền mạch (KHÔNG đánh số, KHÔNG markdown, KHÔNG gạch đầu dòng máy móc):
  (a) QUAN SÁT SỐ: nêu con số cốt lõi khớp câu hỏi, kèm cỡ mẫu của nó.
  (b) ĐẶT VÀO XU HƯỚNG / CHÂN DUNG: nối con số đó với một nét đặc trưng của bạn mà bảng có (dòng "Chân dung của bạn", giờ vàng, độ dài hợp, hướng đi tuần/nhiều tuần, độ đều, loại việc hay theo đuổi…) — cho thấy mình HIỂU thói quen của bạn, không chỉ đọc một ô số rời.
  (c) MỘT lời khuyên cá nhân hoá: tối đa MỘT việc đáng thử, neo thẳng vào con số vừa nêu và đặc điểm của bạn, mở bằng "có thể thử"/"thử". Không ra lệnh, không hứa kết quả. Câu thuần tra cứu (chỉ hỏi một con số) thì được bỏ (c).

CHỌN ĐÚNG DÒNG theo câu hỏi (đừng bốc nhầm dòng):
- nhìn chung mình là người thế nào / điểm mạnh-yếu / hiểu mình → "Chân dung của bạn" (+ nối thêm 1 dòng nổi nhất).
- giờ vàng / khung tập trung tốt → "Giờ vàng".
- hôm nay / đúng nhịp chưa → "Hôm nay".
- tuần này / so với tuần trước → "Xu hướng tuần".
- dạo này / mấy tuần nay / xu hướng dài / so với tháng trước / có đang lên không → "Xu hướng dài hạn" (+ "Xu hướng tuần" + "Tổng quan").
- giờ này nên làm gì → "Khung giờ vàng còn lại hôm nay" + "Giờ vàng".
- làm khuya / ban đêm → dòng "Tỉ lệ đạt mục tiêu của phiên làm sau … giờ đêm".
- hay bỏ dở → "Hay bỏ giữa chừng vào".
- phiên dài bao lâu → "Độ dài hợp nhất".
- phiên sâu → "Phiên sâu".
- mục tiêu ngày hợp lý → "Mục tiêu ngày".
- loại việc nhiều nhất → dòng "Loại việc dành nhiều thời gian nhất là …"; hỏi MỘT loại cụ thể → dòng "Loại việc "<tên>": …" khớp đúng tên trong ngoặc kép; bỏ bê → "Loại bị bỏ bê".
- đều đặn → "Đều đặn"; chuỗi → "Giữ chuỗi"; ngày năng suất → "Ngày năng suất nhất".
Bỏ qua dòng không liên quan. Khi câu hỏi rộng, được nối 2 dòng để dựng "chân dung" nhưng vẫn gói gọn.

QUY TẮC TRUNG THỰC (bạn là model nhỏ, rất dễ sai — tuân TỪNG điều):
- CHỈ DÙNG SỐ TRONG DỮ LIỆU. Mọi con số (phiên, giờ, phút, %, ngày, giờ trong ngày, tuần) phải sao chép NGUYÊN VĂN từ bảng. Cấm tự tính, cấm làm tròn khác, cấm cộng trừ, cấm bịa thêm số/ngày/loại việc không có trong bảng. ĐỌC ĐÚNG GIÁ TRỊ: nội dung thật nằm SAU dấu hai chấm của mỗi dòng; chép NGUYÊN tên/giá trị ở phần sau (vd nếu bảng ghi dòng dạng "Loại việc dành nhiều thời gian nhất là "X": A giờ qua B phiên, đạt mục tiêu C% (trên B phiên)." thì trả lời "X, A giờ qua B phiên, đạt mục tiêu C% trên B phiên" — thay X/A/B/C bằng đúng chữ và số TRONG bảng, đừng lấy nhãn làm nội dung).
- TÊN MỤC ≠ NỘI DUNG. Các chữ đứng TRƯỚC dấu hai chấm như "Loại việc", "Giờ vàng", "Xu hướng dài hạn", "Tỉ lệ đạt mục tiêu của…" CHỈ là tên mục — KHÔNG bao giờ là tên loại việc, KHÔNG bao giờ là một con số. Tên loại việc thật LUÔN nằm trong dấu ngoặc kép (vd "Học", "Làm Việc", "Đọc sách"). Khi được hỏi về một loại việc, chỉ gọi nó bằng cái tên nằm trong dấu ngoặc kép.
- THIẾU THÌ NÓI THIẾU. Dòng ghi "chưa đủ", hoặc bảng không có thứ câu hỏi cần → nói thẳng "mình chưa đủ dữ liệu về …" rồi mời hỏi thứ khác. Không đoán.
- KHÔNG CÓ SỐ THÌ NÓI KHÔNG CÓ. Nếu một KHUNG GIỜ / LOẠI VIỆC / KHOẢNG THỜI GIAN mà câu hỏi nhắc tới KHÔNG có dòng riêng trong DỮ LIỆU, phải nói thẳng "mình không có số liệu về <thứ đó>" — TUYỆT ĐỐI không lấy số của mục khác đắp vào, không ước lượng, không nói chung chung kiểu "thường thì…". Thà trả lời ngắn và nói thiếu, còn hơn dài mà có một số không chắc.
- RANH GIỚI HỌC vs NÓI. Phần ví dụ/khuôn mẫu chỉ để học CÁCH viết. Mọi con số, mọi tên loại việc, mọi khung giờ trong câu trả lời CHỈ được lấy từ phần giữa "=== DỮ LIỆU THẬT ===" và "=== HẾT ===". Ngoài hai mốc đó (kể cả ví dụ, kể cả câu hỏi của người dùng) coi như KHÔNG có dữ liệu.
- MỌI % KÈM CỠ MẪU. Khi nêu một con số %, luôn kèm cụm cỡ mẫu đứng cạnh nó trong bảng ("trên 21 phiên", "trên 8 ngày", "trên 4 tuần", "qua 5 lần"). % nào không có cỡ mẫu thì KHÔNG nói con số % đó.
- CHỈ NÓI TƯƠNG QUAN, KHÔNG NHÂN-QUẢ. Cấm tuyệt đối các từ: vì, nên (chỉ lý do), do, bởi, khiến, dẫn đến, làm cho, gây ra, kết quả là. Chỉ dùng: "có vẻ", "thường", "thường đi cùng", "đi cùng", "hay rơi vào", "tương quan với", "theo thời gian".
- KHÔNG TÂNG BỐC, KHÔNG AN ỦI SÁO RỖNG. Giọng điềm tĩnh, sắc, đúng việc — chất chuyên gia nằm ở việc nối số với thói quen, không ở lời khen.

PHẠM VI: chỉ trả lời về số liệu tập trung của bạn. Câu hỏi kiến thức chung, dịch thuật, chuyện phiếm → nói thẳng đó là ngoài khả năng của mình rồi mời hỏi về số liệu tập trung.

TỰ KIỂM (thầm, KHÔNG in ra) trước khi trả lời: mỗi con số có nằm nguyên văn trong DỮ LIỆU không? mỗi % có kèm cỡ mẫu không? có lỡ dùng từ nhân-quả không? có nối được con số với một nét chân dung của bạn không? có chữ nào không phải tiếng Việt không? — sửa hết rồi mới trả lời. Bảng không có thứ câu hỏi cần → thà nói "chưa đủ dữ liệu" còn hơn bịa.`;


/**
 * buildLLMChatPrompt — như buildLLMPrompt nhưng dùng COACH_CHAT_SYSTEM (hội thoại,
 * không ép khuôn cứng). Dành cho "Hỏi Coach" chat với AI trên máy.
 */
export function buildLLMChatPrompt(context, question, history = []) {
  const ctx = String(context ?? '').slice(0, 6000) || '(chưa có dữ liệu)';
  const system = `${COACH_CHAT_SYSTEM}\n\n=== DỮ LIỆU THẬT ===\n${ctx}\n=== HẾT ===`;
  const q = String(question ?? '').trim() || 'Phân tích nhanh tình hình tập trung gần đây của mình giúp.';
  const past = (Array.isArray(history) ? history : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, messages: [...past, { role: 'user', content: q.slice(0, 2000) }] };
}

export function sanitizeLLMOutput(raw) {
  let s = String(raw ?? '');
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, ' '); // Qwen có thể sinh reasoning
  s = s.replace(/<[^>]*>/g, ' ');
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!s) return '(AI phân tích tổng thể chưa trả lời được — thử lại, hoặc bấm "Hỏi Coach").';
  return s.length > 2200 ? `${s.slice(0, 2197)}…` : s; // nới cho bản phân tích 3 phần (max_tokens 700)
}

/**
 * hasForeignScript — model nhỏ (Qwen) đôi khi "trôi" sang chữ Hán/Trung (小时, 约…),
 * Hàn, Nhật. Tiếng Việt chỉ dùng Latinh + dấu (đều nằm trong Latin/Latin-Extended),
 * nên các dải CJK/Hangul/Kana dưới đây KHÔNG bao giờ xuất hiện trong câu Việt hợp lệ.
 * Dùng để phát hiện rồi tự viết lại (CoachOffline.jsx). Trả true nếu có ký tự lạ.
 */
export function hasForeignScript(s) {
  return /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(String(s ?? ''));
}

// === L\u01af\u1edaI CH\u1eb6N-B\u1ecaA-S\u1ed0 (t\u1ea5t \u0111\u1ecbnh) ===========================================
// Tuy\u1ebfn ph\u00f2ng th\u1ee7 CH\u00cdNH ch\u1ed1ng "H\u1ecfi Coach" b\u1ecba s\u1ed1. Nguy\u00ean t\u1eafc: m\u1ecdi con s\u1ed1 mang
// \u0110\u01a0N V\u1eca-D\u1eee-LI\u1ec6U (gi\u1edd/ph\u00fat/phi\u00ean/ng\u00e0y/tu\u1ea7n/l\u1ea7n/%/h) m\u00e0 model vi\u1ebft ra PH\u1ea2I xu\u1ea5t
// hi\u1ec7n trong b\u1ea3ng s\u1ed1 li\u1ec7u ("=== D\u1eee LI\u1ec6U TH\u1eacT ==="). S\u1ed1 kh\u00f4ng t\u00ecm th\u1ea5y \u2192 coi l\u00e0 B\u1ecaA.
// S\u1ed1 tr\u1ea7n (kh\u00f4ng \u0111\u01a1n v\u1ecb) \u0111\u01b0\u1ee3c MI\u1ec4N TR\u1eea \u0111\u1ec3 kh\u1ecfi b\u00e1o nh\u1ea7m v\u0103n n\u00f3i ("3 nh\u1ecbp", "1 l\u1eddi khuy\u00ean").
// Ch\u1ea1y \u0111\u01b0\u1ee3c \u1edf CI kh\u00f4ng-WebGPU (kh\u00f4ng c\u1ea7n model). KH\u00d4NG b\u1eaft "\u0111\u1ecdc nh\u1ea7m nh\u00e3n" (s\u1ed1 c\u00f3 th\u1eadt)
// \u2014 c\u00e1i \u0111\u00f3 do prompt "\u0110\u1eccC \u0110\u00daNG GI\u00c1 TR\u1eca" + \u0111\u1ecbnh d\u1ea1ng b\u1ea3ng lo.
const GUARD_UNIT = '(?:%|h(?![a-z\u00e0-\u1ef9])|\\s?(?:gi\u1edd|ti\u1ebfng|ph\u00fat|phi\u00ean|ng\u00e0y|tu\u1ea7n|l\u1ea7n))';
const GUARD_NUM_UNIT = new RegExp(`(\\d[\\d.,]*)\\s*${GUARD_UNIT}`, 'giu');

// Chu\u1ea9n ho\u00e1 \u0111\u1ec3 so kh\u1edbp b\u1ea5t ch\u1ea5p kh\u00e1c bi\u1ec7t v\u1eb7t (d\u1ea5u c\u00e1ch, 'h' vs ' gi\u1edd', d\u1ea5u ph\u1ea9y th\u1eadp ph\u00e2n).
function normNumUnit(numRaw, unitRaw) {
  const num = String(numRaw).replace(/,/g, '.').replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  let unit = String(unitRaw).trim().toLowerCase();
  if (unit === 'h' || unit === 'ti\u1ebfng') unit = 'gi\u1edd'; // "13.3 ti\u1ebfng" == "13.3 gi\u1edd" == "13.3h"
  return `${num} ${unit}`;
}

// Tr\u00edch m\u1ecdi c\u1eb7p (s\u1ed1 + \u0111\u01a1n v\u1ecb-d\u1eef-li\u1ec7u) trong m\u1ed9t \u0111o\u1ea1n \u2192 m\u1ea3ng chu\u1ed7i \u0111\u00e3 chu\u1ea9n ho\u00e1.
function extractDataNumbers(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(GUARD_NUM_UNIT)) {
    const num = m[1];
    const unit = m[0].slice(m[0].indexOf(num) + num.length);
    out.push(normNumUnit(num, unit));
  }
  return out;
}

/**
 * findFabricatedNumbers \u2014 T\u1ea4T \u0110\u1ecaNH. Tr\u1ea3 v\u1ec1 m\u1ea3ng con s\u1ed1 (\u0111\u00e3 chu\u1ea9n ho\u00e1) m\u00e0 c\u00e2u tr\u1ea3 l\u1eddi n\u00eau
 * K\u00c8M \u0111\u01a1n v\u1ecb-d\u1eef-li\u1ec7u nh\u01b0ng KH\u00d4NG c\u00f3 trong context. M\u1ea3ng r\u1ed7ng = s\u1ea1ch.
 * @param {string} answer  c\u00e2u tr\u1ea3 l\u1eddi c\u1ee7a Coach
 * @param {string} context chu\u1ed7i buildAnalystContext
 */
export function findFabricatedNumbers(answer, context) {
  const ctx = String(context ?? '');
  if (!ctx.trim()) return []; // kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u n\u1ec1n \u0111\u1ec3 \u0111\u1ed1i chi\u1ebfu \u2192 kh\u00f4ng k\u1ebft t\u1ed9i
  const ctxSet = new Set(extractDataNumbers(ctx));
  const bad = [];
  const seen = new Set();
  for (const tok of extractDataNumbers(answer)) {
    if (ctxSet.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    bad.push(tok);
  }
  return bad;
}

/** hasFabricatedNumbers \u2014 ti\u1ec7n \u00edch boolean cho l\u1edbp UI. */
export function hasFabricatedNumbers(answer, context) {
  return findFabricatedNumbers(answer, context).length > 0;
}

// Tr\u00edch c\u1eb7p (ph\u1ea7n-tr\u0103m, c\u1ee1-m\u1eabu) tr\u00ean C\u00d9NG c\u1ee5m \u2014 HAI CHI\u1ec0U, cho ph\u00e9p ngo\u1eb7c/ph\u1ea9y/v\u00e0i ch\u1eef ch\u00e8n.
// CH\u1ec8 b\u1eaft khi % \u0110\u1ee8NG C\u1ea0NH m\u1ed9t c\u1ee1 m\u1eabu "tr\u00ean N <\u0111v>" (chi\u1ec1u A) ho\u1eb7c "N <\u0111v> \u2026 (\u2026X%)" (chi\u1ec1u B).
// % so-s\u00e1nh kh\u00f4ng c\u1ee1 m\u1eabu (91%/37%) v\u00e0 m\u1eabu ph\u00e2n s\u1ed1 (11/38) KH\u00d4NG kh\u1edbp \u2192 KH\u00d4NG \u00e9p c\u1eb7p (nghi th\u00ec tha).
function extractPctSamplePairs(text) {
  const out = [];
  const norm = (s) => String(s).replace(/,/g, '.').replace(/\.0+$/, '');
  const reA = /(\d[\d.,]*)\s*%[^\d%]{0,12}?tr\u00ean\s+(\d[\d.,]*)\s*(phi\u00ean|ng\u00e0y|tu\u1ea7n|l\u1ea7n)/giu;
  const reB = /(\d[\d.,]*)\s*(phi\u00ean|ng\u00e0y|tu\u1ea7n|l\u1ea7n)[^\d%]{0,20}?\([^)]*?(\d[\d.,]*)\s*%\)/giu;
  const s = String(text ?? '');
  for (const m of s.matchAll(reA)) out.push(`${norm(m[1])}%|${norm(m[2])} ${m[3].toLowerCase()}`);
  for (const m of s.matchAll(reB)) out.push(`${norm(m[3])}%|${norm(m[1])} ${m[2].toLowerCase()}`);
  return out;
}

/**
 * findMismatchedPairs \u2014 b\u1eaft ki\u1ec3u b\u1ecba tinh vi: % GH\u00c9P SAI c\u1ee1 m\u1eabu (c\u1ea3 hai s\u1ed1 \u0111\u1ec1u C\u00d3 trong b\u1ea3ng
 * nh\u01b0ng \u1edf hai d\u00f2ng kh\u00e1c nhau, vd "\u0111\u1ea1t 79% tr\u00ean 18 phi\u00ean" khi 79% l\u00e0 t\u1ed5ng c\u00f2n 18 phi\u00ean l\u00e0 c\u1ee7a
 * "H\u1ecdc"). Tr\u1ea3 m\u1ea3ng c\u1eb7p (chu\u1ea9n ho\u00e1) c\u00f3 trong answer m\u00e0 KH\u00d4NG c\u00f3 trong context. M\u1ea3ng r\u1ed7ng = s\u1ea1ch.
 * C\u1ed1 t\u00ecnh B\u1ea2O TH\u1ee6 (ch\u1ec9 b\u1eaft c\u1eb7p k\u1ec1-nhau r\u00f5 r\u00e0ng) \u0111\u1ec3 tr\u00e1nh xo\u00e1 nh\u1ea7m c\u00e2u th\u1eadt.
 */
export function findMismatchedPairs(answer, context) {
  const ctx = String(context ?? '');
  if (!ctx.trim()) return [];
  const ok = new Set(extractPctSamplePairs(ctx));
  const bad = [];
  const seen = new Set();
  for (const p of extractPctSamplePairs(answer)) {
    if (ok.has(p) || seen.has(p)) continue;
    seen.add(p);
    bad.push(p);
  }
  return bad;
}

// \u0110\u1ed5i token chu\u1ea9n-ho\u00e1 c\u1ee7a guard v\u1ec1 d\u1ea1ng \u0111\u1ecdc-\u0111\u01b0\u1ee3c cho c\u00e2u nh\u1eafc: "88 %" \u2192 "88%" (b\u1ecf space tr\u01b0\u1edbc %).
function prettyGuardToken(tok) {
  return String(tok).replace(/\s+%$/, '%');
}

/**
 * buildCorrectionNote \u2014 VI\u1ebeT-L\u1ea0I-C\u00d3-H\u01af\u1edaNG-D\u1eaaN: d\u1ef1ng c\u00e2u user-turn LI\u1ec6T K\u00ca \u0110\u00cdCH DANH s\u1ed1 b\u1ecba
 * \u0111\u1ec3 ch\u00e8n v\u00e0o l\u01b0\u1ee3t ch\u1ea1y th\u1ee9 2 (model bi\u1ebft ch\u00ednh x\u00e1c token n\u00e0o n\u00f3 v\u1eeba b\u1ecba). KH\u00d4NG n\u1edbi guard \u2014
 * ch\u1ec9 t\u0103ng t\u1ec9 l\u1ec7 l\u1ea7n-2-\u0111\u00fang; tuy\u1ebfn ch\u00f3t v\u1eabn l\u00e0 findFabricatedNumbers. Tr\u1ea3 '' n\u1ebfu kh\u00f4ng c\u00f3 s\u1ed1 b\u1ecba.
 */
export function buildCorrectionNote(badNums) {
  const list = (Array.isArray(badNums) ? badNums : []).map(prettyGuardToken).filter(Boolean);
  if (!list.length) return '';
  const quoted = list.map((n) => `"${n}"`).join(', ');
  return `C\u00e2u tr\u1ea3 l\u1eddi v\u1eeba r\u1ed3i c\u1ee7a b\u1ea1n c\u00f3 ch\u1ee9a c\u00e1c con s\u1ed1 KH\u00d4NG c\u00f3 trong b\u1ea3ng "=== D\u1eee LI\u1ec6U TH\u1eacT ===": ${quoted}. \u0110\u00e2y l\u00e0 s\u1ed1 b\u1ecba \u2014 kh\u00f4ng \u0111\u01b0\u1ee3c ph\u00e9p. H\u00e3y tr\u1ea3 l\u1eddi L\u1ea0I c\u00e2u h\u1ecfi c\u0169: ch\u1ec9 d\u00f9ng s\u1ed1 xu\u1ea5t hi\u1ec7n nguy\u00ean v\u0103n trong b\u1ea3ng (ch\u00e9p \u0111\u00fang t\u1eebng ch\u1eef s\u1ed1, kh\u00f4ng t\u1ef1 t\u00ednh, kh\u00f4ng l\u00e0m tr\u00f2n kh\u00e1c); con s\u1ed1 n\u00e0o b\u1ea3ng KH\u00d4NG c\u00f3 th\u00ec n\u00f3i th\u1eb3ng "m\u00ecnh ch\u01b0a c\u00f3 s\u1ed1 n\u00e0y trong d\u1eef li\u1ec7u" thay v\u00ec b\u1ecba s\u1ed1 kh\u00e1c; m\u1ed7i % v\u1eabn k\u00e8m c\u1ee1 m\u1eabu c\u1ea1nh n\u00f3 trong b\u1ea3ng; v\u1eabn 100% ti\u1ebfng Vi\u1ec7t, kh\u00f4ng d\u00f9ng t\u1eeb nh\u00e2n-qu\u1ea3. B\u1ea3ng kh\u00f4ng \u0111\u1ee7 s\u1ed1 \u0111\u1ec3 tr\u1ea3 l\u1eddi th\u00ec n\u00f3i th\u1eb3ng l\u00e0 ch\u01b0a \u0111\u1ee7 d\u1eef li\u1ec7u.`;
}

/**
 * appendCorrectionTurn \u2014 gh\u00e9p l\u01b0\u1ee3t s\u1eeda l\u1ed7i v\u00e0o CU\u1ed0I m\u1ea3ng messages (system gi\u1eef ri\u00eang, kh\u00f4ng \u0111\u1ee5ng).
 * Tr\u1ea3 m\u1ea3ng M\u1edaI, KH\u00d4NG mutate prev. correctionNote r\u1ed7ng \u2192 tr\u1ea3 nguy\u00ean prev (g\u1ecdi an to\u00e0n).
 */
export function appendCorrectionTurn(prevMessages, lastAnswer, correctionNote) {
  const base = Array.isArray(prevMessages) ? prevMessages : [];
  const note = String(correctionNote ?? '').trim();
  if (!note) return base;
  return [...base, { role: 'assistant', content: String(lastAnswer ?? '') }, { role: 'user', content: note }];
}

const FABRICATION_FALLBACK =
  'C\u00e2u n\u00e0y m\u00ecnh ch\u01b0a \u0111\u1ee7 d\u1eef li\u1ec7u ch\u1eafc ch\u1eafn \u0111\u1ec3 tr\u1ea3 l\u1eddi b\u1eb1ng con s\u1ed1 \u2014 b\u1ea1n th\u1eed h\u1ecfi m\u1ed9t ch\u1ec9 s\u1ed1 kh\u00e1c (gi\u1edd v\u00e0ng, lo\u1ea1i vi\u1ec7c, h\u00f4m nay\u2026) nh\u00e9.';

/**
 * stripFabricatedSentences \u2014 C\u1ee8U-C\u00c2U cho CHAT (CoachChat). B\u1ecf RI\u00caNG c\u00e2u ch\u1ee9a s\u1ed1-b\u1ecba, gi\u1eef c\u00e2u
 * s\u1ea1ch nguy\u00ean v\u0103n (\u0111\u1ee1 ph\u0169 h\u01a1n nuke c\u1ea3 c\u00e2u tr\u1ea3 l\u1eddi). B\u1ecf h\u1ebft \u2192 fallback. T\u1ea5t \u0111\u1ecbnh, ti\u1ebfng-Vi\u1ec7t-safe
 * (kh\u00f4ng c\u1eaft "13.3"). Ca x\u1ea5u nh\u1ea5t (c\u00e2u d\u00e0i n\u1ed1i d\u1ea5u ph\u1ea9y) = \u0111\u00fang b\u1eb1ng nuke c\u0169, KH\u00d4NG t\u1ec7 h\u01a1n.
 * @returns {{clean: string, removed: string[]}}
 */
export function stripFabricatedSentences(answer, context, opts = {}) {
  const fallback = (opts && typeof opts.fallback === 'string' && opts.fallback.trim()) || FABRICATION_FALLBACK;
  const text = String(answer ?? '');
  if (!text.trim()) return { clean: fallback, removed: [] };
  const ctx = String(context ?? '');
  if (!ctx.trim()) return { clean: text, removed: [] }; // kh\u00f4ng b\u1ea3ng n\u1ec1n \u2192 kh\u00f4ng k\u1ebft t\u1ed9i
  // V\u00e1ch c\u00e2u = xu\u1ed1ng d\u00f2ng, ho\u1eb7c . ! ? \u2026 KH\u00d4NG \u0111\u1ee9ng tr\u01b0\u1edbc ch\u1eef s\u1ed1 (gi\u1eef "13.3") v\u00e0 c\u00f3 kho\u1ea3ng tr\u1eafng sau.
  const parts = text.split(/(\n+|(?<=[.!?\u2026])(?!\d)(?=\s))/u);
  const removed = [];
  const kept = [];
  let buf = '';
  const flush = () => {
    if (!buf) return;
    const core = buf.trim();
    if (core && (findFabricatedNumbers(core, ctx).length > 0 || findMismatchedPairs(core, ctx).length > 0)) removed.push(core);
    else kept.push(buf);
    buf = '';
  };
  for (const seg of parts) {
    if (seg === undefined) continue;
    if (/^\n+$/.test(seg)) { flush(); kept.push(seg); continue; }
    buf += seg;
    if (/[.!?\u2026]\s*$/u.test(seg) && !/\d[.!?\u2026]\d*\s*$/.test(seg)) flush();
  }
  flush();
  let clean = kept.join('').replace(/[ \t]+/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) clean = fallback;
  return { clean, removed };
}

/**
 * scrubFabricatedLines \u2014 C\u1ee8U-C\u00c2U cho b\u1ea3n PH\u00c2N T\u00cdCH 4 ph\u1ea7n (CoachOffline). L\u1ecdc T\u1eeaNG D\u00d2NG: d\u00f2ng
 * ch\u1ee9a s\u1ed1-b\u1ecba \u2192 b\u1ecf; gi\u1eef d\u00f2ng s\u1ea1ch + nh\u00e3n [1][2][3][4]. Ph\u1ea7n [n] r\u1ed7ng sau l\u1ecdc \u2192 ch\u00e8n "ch\u01b0a \u0111\u1ee7
 * d\u1eef li\u1ec7u" (gi\u1eef nh\u00e3n). L\u1ecdc s\u1ea1ch to\u00e0n b\u00e0i \u2192 fallback. H\u1ee3p c\u1ea5u tr\u00fac 4 ph\u1ea7n h\u01a1n l\u00e0 t\u00e1ch-c\u00e2u.
 * @returns {{clean: string, removed: string[]}}
 */
export function scrubFabricatedLines(answer, context, opts = {}) {
  const fallback = (opts && typeof opts.fallback === 'string' && opts.fallback.trim()) ||
    'AI tr\u00ean m\u00e1y ch\u01b0a \u0111\u1ecdc s\u1ed1 ch\u1eafc ch\u1eafn \u2014 b\u1ea1n th\u1eed l\u1ea1i, ho\u1eb7c d\u00f9ng "H\u1ecfi Coach".';
  const text = String(answer ?? '');
  if (!text.trim()) return { clean: fallback, removed: [] };
  const ctx = String(context ?? '');
  if (!ctx.trim()) return { clean: text, removed: [] };
  const isLabel = (l) => /^\s*\[[1-4]\]/.test(l);
  const removed = [];
  const out = [];
  for (const line of text.split('\n')) {
    if (isLabel(line) || !line.trim()) { out.push(line); continue; } // gi\u1eef nh\u00e3n + d\u00f2ng tr\u1ed1ng
    if (findFabricatedNumbers(line, ctx).length > 0 || findMismatchedPairs(line, ctx).length > 0) { removed.push(line.trim()); continue; }
    out.push(line);
  }
  const filled = [];
  for (let i = 0; i < out.length; i += 1) {
    filled.push(out[i]);
    if (isLabel(out[i])) {
      let j = i + 1, hasBody = false;
      while (j < out.length && !isLabel(out[j])) { if (out[j].trim()) hasBody = true; j += 1; }
      if (!hasBody) filled.push('ch\u01b0a \u0111\u1ee7 d\u1eef li\u1ec7u');
    }
  }
  let clean = filled.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const anyBody = filled.some((l) => l.trim() && !isLabel(l) && l.trim() !== 'ch\u01b0a \u0111\u1ee7 d\u1eef li\u1ec7u');
  if (!clean || !anyBody) clean = fallback;
  return { clean, removed };
}

export function detectWebLLMCapable(nav, win) {
  const n = nav ?? (typeof navigator !== 'undefined' ? navigator : null);
  const w = win ?? (typeof window !== 'undefined' ? window : null);
  if (!n || !w) return false;
  if (/iP(hone|ad|od)/i.test(n.userAgent || '')) return false; // iOS WebGPU yếu → giữ bản cũ
  if (!('gpu' in n)) return false; // cần WebGPU
  return (w.innerWidth || 0) >= 1024; // chỉ desktop
}

export function mapInitProgress(p) {
  if (p && typeof p.progress === 'number') return Math.round(Math.min(1, Math.max(0, p.progress)) * 100);
  return 0;
}
