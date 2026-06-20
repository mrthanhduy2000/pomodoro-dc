# Agent 20: Báo cáo thẩm định độ tự nhiên

Phạm vi: chạy 57 ngữ cảnh, mỗi ngữ cảnh 24 lần cho cả 3 tính cách (4104 lượt sinh), cộng vòng soát tay trên kho câu. Dưới đây là các lỗi mẫu hay gặp nhất và cách đã sửa, để vòng lặp sau khỏi mắc lại.

## Các lỗi mẫu hay gặp và đã xử lý

1. Lộ đơn vị hoặc sai đơn vị tiếng Việt
   - Triệu chứng: "phiên thứ 4 phiên", "1 giờ 30 phút phút".
   - Nguyên nhân: placeholder điền số kèm đơn vị, nhưng câu gốc đã có sẵn đơn vị.
   - Cách sửa: `fillTemplate` nhìn chữ đứng quanh placeholder. Nếu sau nó đã có "phiên/lần/buổi/ngày" hoặc trước nó là "thứ" thì chỉ điền con số; ngược lại mới tự thêm đơn vị. Có thêm một lớp gộp đơn vị lặp để phòng hờ.

2. Viết hoa sai sau con số
   - Triệu chứng: "4 Phiên, không một lần đứt".
   - Nguyên nhân: hàm viết hoa đầu câu nhắm vào chữ cái đầu tiên, mà câu lại mở đầu bằng số.
   - Cách sửa: chỉ viết hoa khi ký tự đầu là chữ cái. Câu mở đầu bằng số thì giữ nguyên.

3. Vượt quá 2 câu
   - Triệu chứng: tầng nhuốm giọng zen thêm một mở đầu là cả một câu ("Ngồi yên một chút.") vào câu vốn đã có 2 câu, thành 3 câu.
   - Cách sửa: chỉ thêm mở đầu zen khi câu gốc đang là một câu, và không hạ chữ đầu qua ranh giới câu.

4. Chồng tiểu từ, nghe lắp
   - Triệu chứng: buddy ra "Mà nè, ... rồi nè,".
   - Cách sửa: bỏ hẳn mở đầu ngập ngừng cho buddy (buddy đã đủ chất riêng), chỉ giữ cho zen và chỉ với câu ngắn.

5. Edge case cướp intent của phiên nghỉ
   - Triệu chứng: đang `long_break` mà lại ra `acknowledge` thay vì `relax`.
   - Nguyên nhân: luật "vào mạch sâu" không kiểm tra phase.
   - Cách sửa: luật `deep_flow` chỉ xét trong phiên focus.

6. Điền số vô lý ở tình huống biên
   - Triệu chứng: chuỗi vừa đứt (streak 0) mà câu lại nói "chuỗi 0 ngày".
   - Cách sửa: lọc khả dụng. Câu nào cần số liệu mà số liệu bằng 0 hoặc thiếu thì không được chọn; nếu cả nhóm đều cần thì mới hạ tiêu chuẩn.

## Các điểm đã đạt

- Không lượt nào lộ chữ undefined, không còn placeholder thừa, không khoảng trắng đôi, không dấu gạch ngang dài.
- Nhóm `remind` không dính từ phán xét hay tiêu cực ở bất kỳ lượt nào.
- Chống lặp: 40 lượt liên tiếp cùng ngữ cảnh, 0 lần lặp ngay sát; zen và buddy cho ra hơn 24 câu khác nhau nhờ tầng biến thể và tự nhiên hóa.
- Giọng phân biệt rõ: strict cô đọng dứt khoát, zen tĩnh và thấm chánh niệm, buddy gần gũi có chút hài.

## Gợi ý cho vòng sau

- Tăng thêm biến thể cho strict (hiện giữ gọn, ít trang trí nên số câu khác nhau thấp hơn).
- Có thể nối Pattern Detector sâu hơn để chèn một câu cá nhân hóa thưa thớt (ví dụ "buổi chiều hay bị ngắt") khi dữ liệu nhiều phiên cho phép.
