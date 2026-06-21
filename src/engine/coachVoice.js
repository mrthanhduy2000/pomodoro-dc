/*
  ===================================================================
  AI COACH GIẢ LẬP LLM cho app Pomodoro
  -------------------------------------------------------------------
  Không gọi API thật. Dùng rule engine + kho câu + template + chấm
  điểm ngữ cảnh để mô phỏng một trợ lý thông minh, sao cho người dùng
  tin là đang nói chuyện với AI thật.

  File này tự chứa, JavaScript thuần, không phụ thuộc thư viện ngoài,
  không dùng localStorage / sessionStorage. Chạy được trong artifact
  (trình duyệt) hoặc bằng node.

  20 tầng (agent) được đánh dấu bằng các khối "===== Agent N =====".
  Các hàm theo đúng interface contract:
    scoreContext, selectIntent, pickTemplate, fillTemplate,
    applyTone, generateCoachMessage
  ===================================================================
*/

/* =====================================================================
   DỮ LIỆU NỘI DUNG
   CONTENT   : Agent 12 (encourage) 13 (acknowledge) 14 (remind) 15 (relax)
   SYNONYMS  : Agent 4
   TONE      : Agent 3
   EDGE_CASES: Agent 11
   Toàn bộ đã qua một vòng soát tự nhiên hóa (Agent 20).
   ===================================================================== */

// ----- Agent 12 13 14 15: Kho câu theo intent rồi personality -----
export const CONTENT = {
  encourage: {
    strict: [
      "Mở việc ra, bắt đầu ngay bây giờ.",
      "Không cần thấy thích mới làm. Cứ làm rồi sẽ vào guồng.",
      "Chọn một việc, rồi bắt tay vào luôn.",
      "Đừng chờ động lực, phiên này khởi động ngay.",
      "Bạn đã giữ chuỗi {streak_days} ngày, đừng để hôm nay hụt.",
      "Úp điện thoại xuống, tắt thông báo, vào việc.",
      "Mục tiêu phiên này là gì? Trả lời xong là chạy.",
      "Phiên thứ {sessions_today} hôm nay, làm cho ra việc.",
      "Đồng hồ đã chạy thì tay phải chạy theo.",
      "Khó cũng chỉ là vài phút đầu thôi, bắt đầu đi.",
      "Tập trung là một lựa chọn, chọn nó ngay phút này.",
      "Bớt nghĩ lại, để kết quả nói thay bạn.",
      "Việc khó nhất hôm nay thì làm trước tiên.",
      "Chậm cũng được, nhưng dứt khoát phải bắt đầu.",
      "Không có lúc nào sẵn sàng hơn lúc này đâu.",
    ],
    zen: [
      "Hít một hơi sâu, rồi nhẹ nhàng bước vào phiên.",
      "Việc vẫn đang chờ, không vội, chỉ cần bạn có mặt.",
      "Buông những thứ ngoài kia, giữ lại một việc trước mắt.",
      "Bạn còn nhớ hơi thở của mình không? Bắt đầu từ đó.",
      "Cứ để mình chảy vào việc một cách tự nhiên.",
      "Không cần hoàn hảo, chỉ cần hiện diện ở đây lúc này.",
      "Đặt tâm xuống nhẹ như đặt một chiếc lá lên mặt hồ.",
      "Một phiên nhỏ thôi, như một bước chân an tĩnh.",
      "Mọi thứ khác có thể đợi, giây phút này dành cho việc này.",
      "Chuỗi {streak_days} ngày là những bước chân lặng lẽ nối nhau.",
      "Lúc bắt đầu cũng bình yên như lúc kết thúc vậy.",
      "Để tâm trí lắng lại, rồi đôi tay sẽ tự tìm đường.",
      "Không cần gồng, chỉ cần thở đều và mở việc ra.",
      "Ngồi yên một nhịp, rồi khẽ khàng bắt đầu.",
      "Bạn không phải vội đi đâu cả, chỉ cần ở lại với việc này.",
    ],
    buddy: [
      "Nào, làm cái này chút thôi, không nặng nề gì đâu.",
      "Mở việc lên đi, bắt đầu rồi tự khắc cuốn cho coi.",
      "Hôm nay phiên thứ {sessions_today} rồi đó, ngon lành ghê.",
      "Khởi động nhẹ nhàng thôi, đừng nghĩ nhiều cho mệt.",
      "Chuỗi {streak_days} ngày rồi nha, tiếc gì mà không tiếp.",
      "Làm chung nha, mình ngồi đây với bạn nè.",
      "Cứ bắt đầu đại đi, dở thì sửa sau, lo gì.",
      "Đặt mông xuống ghế là coi như xong nửa trận rồi đó.",
      "Việc nó không tự làm đâu, nhưng mình thì làm được mà.",
      "Năm phút đầu hơi uể oải, qua rồi là phê liền.",
      "Thôi đừng lướt nữa, vô việc cái cho rồi nha.",
      "Tin mình đi, bắt đầu xong là thấy nhẹ cả người.",
      "Một phiên thôi mà, xíu là xong à, chơi luôn đi.",
      "Sẵn sàng chưa? Bấm nút đi, mình đợi nè.",
    ],
  },
  acknowledge: {
    strict: [
      "Xong phiên này là {sessions_today} phiên hôm nay. Giữ nhịp đó.",
      "Chuỗi {streak_days} ngày vẫn nguyên. Đừng để hôm nay làm gãy nó.",
      "{total_focus_minutes} đã vào sổ. Con số đó không biết nói dối.",
      "Phiên vừa rồi sạch, không một lần gián đoạn. Đúng chuẩn.",
      "Đủ {sessions_today} phiên rồi. Phần khó nhất đã ở sau lưng.",
      "Vừa cộng thêm một phiên vào {total_focus_minutes}. Được.",
      "Kỷ luật mới giữ nổi {streak_days} ngày liền, không phải may.",
      "Một phiên nữa khép lại. Uống ngụm nước, rồi quay vào.",
      "Hôm nay {sessions_today} phiên. Mức này tạm chấp nhận.",
      "Ngồi yên hết phiên không nhúc nhích. Đó mới là cái đáng tính.",
      "Bao nhiêu ngày qua không bỏ một buổi nào. Cứ thế mà tiếp.",
      "Kết quả nằm đó rồi. Nghỉ ngắn, vào phiên kế.",
      "Phiên này nhỉnh hơn phiên trước. Ghi nhận, đi tiếp.",
      "Phần của mình hôm nay bạn làm xong. {sessions_today} phiên, gọn gàng.",
      "Đứng dậy giãn vai một cái. Phiên sau đừng để chùng.",
    ],
    zen: [
      "Một phiên vừa khép lại. Thở ra, để nó lắng xuống.",
      "{sessions_today} phiên hôm nay, mỗi phiên trọn như một hơi thở.",
      "Chuỗi {streak_days} ngày cứ trôi đều, lặng lẽ mà bền.",
      "Bạn vừa dành trọn quãng vừa rồi cho một việc. Quý lắm.",
      "{total_focus_minutes} đã tích lại, từng phút một, chẳng vội vàng.",
      "Sau phiên, có chút yên đang ngồi lại trong lòng bạn đấy.",
      "Bạn có nhận ra không, tâm vừa ở lại trọn một phiên?",
      "Suốt {streak_days} ngày qua, ngày nào bạn cũng tìm về với mình.",
      "Phiên xong rồi. Ngồi thêm một nhịp, đừng vội rời chỗ.",
      "{sessions_today} lần hôm nay bạn chọn ở lại với hiện tại.",
      "Không cần thêm điều gì. Phiên này tự nó đã đủ.",
      "Như giọt nước nhỏ vào chum, {total_focus_minutes} cứ đầy dần.",
      "Bạn đã có mặt suốt phiên vừa rồi. Hãy để mình tận hưởng nó.",
      "Thở vào, biết mình vừa xong. Thở ra, buông cho nhẹ.",
    ],
    buddy: [
      "Ê được {sessions_today} phiên rồi đó, ngon lành ghê.",
      "Chuỗi {streak_days} ngày luôn hả? Nể bạn thiệt sự.",
      "Vừa xong một phiên không hề xao nhãng, mê chưa.",
      "Nhìn lại {total_focus_minutes} đi, gom góp cũng kha khá rồi nha.",
      "Phiên này trôi cái vèo, bạn vào guồng rồi đó.",
      "Tự thưởng cái gì đi, {sessions_today} phiên hôm nay xứng đáng mà.",
      "Giữ chuỗi tới {streak_days} ngày, bạn lì dễ sợ luôn á.",
      "Xong phiên rồi nè, đứng dậy vươn vai cái coi.",
      "Thấy chưa, làm được mà, một phiên nữa vô túi rồi.",
      "Hôm nay bạn chăm dữ, {sessions_today} phiên đâu phải ít.",
      "Cái chuỗi {streak_days} ngày này đẹp lắm, ráng giữ giùm nha.",
      "Phiên vừa rồi mượt phết, cứ đà này là ổn áp rồi.",
      "Trộm vía, bạn đang on fire với {sessions_today} phiên đó.",
      "Lẹ ghê, mới đó mà {total_focus_minutes} đã cộng thêm rồi.",
    ],
  },
  remind: {
    strict: [
      "Một việc thôi, để nó trong tầm mắt. Cái khác cho ra ngoài.",
      "Úp điện thoại xuống, quay lại chỗ đang dở.",
      "Đóng bớt tab đi, chừa lại đúng cái đang cần.",
      "Chọn một điểm để bám, rồi giữ chặt ở đó.",
      "Tắt thông báo mười lăm phút. Chỉ mười lăm phút thôi.",
      "Đặt điện thoại xa tầm tay, bắt đầu lại từ dòng này.",
      "Việc này cần bạn trọn vẹn, đừng chia ra nhiều hướng.",
      "Mấy thứ lặt vặt để sau giờ này hẵng đụng.",
      "Tay đặt lại bàn phím, mắt về màn hình, đi tiếp.",
      "Cái cần làm vẫn nằm yên đó. Hướng về nó.",
      "Khép cửa sổ tin nhắn lại, lát mở cũng kịp.",
      "Đặt một mục tiêu cho phiên này, còn lại gác sang bên.",
      "Đừng để màn hình dẫn bạn đi. Kéo nó về việc chính.",
      "Ngừng lướt, đặt máy xuống, vào lại nhịp làm việc.",
      "Một dòng đang chờ bạn viết tiếp. Bắt đầu từ đó.",
    ],
    zen: [
      "Mỗi lần lạc, chỉ cần khẽ quay về. Vậy là đủ.",
      "Hơi thở vẫn ở đây, bạn cũng vậy. Mình bắt đầu lại nhé.",
      "Tâm trí đi rong là chuyện thường. Nhẹ nhàng dẫn nó về.",
      "Thử đặt điện thoại nằm im, như đặt một viên đá xuống.",
      "Có tiếng thông báo gọi không? Mình để nó trôi qua.",
      "Một khoảng lặng nhỏ, một tab thôi, một việc thôi.",
      "Bạn không cần đuổi theo mọi thứ. Ở lại với điều trước mặt là được.",
      "Khi rối, thở ra thật chậm rồi nhìn lại trang đang mở.",
      "Cứ để những cửa sổ thừa khép lại, như khép mắt một nhịp.",
      "Vừa nãy đi xa một chút cũng không sao. Đường về luôn còn đó.",
      "Để màn hình tĩnh lại trước, rồi lòng cũng dịu theo.",
      "Một hơi vào, một hơi ra, và bạn lại có mặt ở đây.",
      "Tiếng ồn ngoài kia có thể đợi. Khoảnh khắc này là của bạn.",
      "Buông bớt những gì đang níu mắt, giữ lại một điều dịu dàng để làm.",
    ],
    buddy: [
      "Ê, hình như có gì đang kéo bạn đi đó. Quay lại tí nha.",
      "Úp cái điện thoại xuống coi, mình làm nốt đoạn này đã.",
      "Tab hơi nhiều rồi nè, dẹp bớt cho dễ thở nha.",
      "Để chế độ im lặng mười lăm phút thôi, xong mở lại liền.",
      "Lạc xíu thì cũng thường mà, vô lại với mình nha.",
      "Thử cất điện thoại qua phòng khác xem, lát ra lấy.",
      "Mình chốt một việc thôi nha, mấy cái kia tính sau.",
      "Cái màn hình lắm trò ghê, dụ nó về việc chính thôi.",
      "Hít thở cái đã, rồi mình đi tiếp, nhẹ nhàng thôi.",
      "Có gì đang rộn trong đầu hả? Ghi ra giấy rồi quay lại nè.",
      "Đóng giúp mình cái cửa sổ tin nhắn nha, lát rảnh mở lại.",
      "Quay về đây nè, mình làm chung tiếp, không vội đâu.",
      "Để mấy thông báo nó đợi xíu, mình đang giữa chừng mà.",
      "Trôi đi rồi hả? Kéo ghế lại bàn thôi nào, có mình đây.",
    ],
  },
  relax: {
    strict: [
      "Hết giờ rồi. Đứng dậy, rời màn hình.",
      "Nghỉ là một phần của kỷ luật, không phải thứ xa xỉ.",
      "Buông bàn phím ra. Việc vẫn ở đó khi bạn quay lại.",
      "Đủ rồi cho lúc này. {sessions_today} phiên là đã ra việc.",
      "Dừng đúng lúc cũng là một kỹ năng. Luyện nó đi.",
      "Đừng ép thêm phiên nữa. Cơ thể đang cần khoảng trống.",
      "Khép việc lại. Người mệt thì làm gì cũng hỏng.",
      "Nghỉ năm phút cho ra nghỉ, đừng liếc lại việc.",
      "Rời ghế ngay. Lấy cốc nước rồi mới tính tiếp.",
      "Tổng {total_focus_minutes} hôm nay là sòng phẳng. Cho phép mình dừng.",
      "Trong giờ nghỉ, không đụng vào thông báo. Tự ra lệnh cho mình đi.",
      "Đưa mắt ra xa màn hình. Nhìn ra cửa sổ một lúc.",
      "Nghỉ tử tế bây giờ thì phiên sau mới không vỡ.",
      "Tắt máy đi. Lúc đầu nhẹ rồi hãy ngồi lại.",
    ],
    zen: [
      "Hít một hơi dài, rồi thở ra thật chậm. Vậy là đủ cho lúc này.",
      "Đặt việc xuống, như buông một viên đá nặng khỏi lòng bàn tay.",
      "Bạn có đang nghe thấy hơi thở mình vào ra không?",
      "Giờ nghỉ là khoảng lặng giữa hai nốt nhạc. Cứ để nó trống.",
      "Buông thôi. Phút này chẳng có gì cần níu giữ.",
      "Cảm nhận hai vai đang hạ xuống, thật từ từ.",
      "Việc gì rồi cũng tới lượt nó. Bây giờ chỉ có hơi thở và bạn.",
      "Để ý bàn chân chạm đất. Bạn đang ở đây, ngay lúc này.",
      "Nhắm mắt một nhịp. Thế giới vẫn quay mà chẳng cần bạn giữ.",
      "Một ngụm nước, một hơi thở, một khoảng lặng. Thế là đủ.",
      "Có suy nghĩ nào nổi lên, cứ nhìn nó trôi qua, đừng bám theo.",
      "Sau {sessions_today} phiên, để tâm trí lặng lại như mặt hồ buổi sớm.",
      "Thả lỏng quai hàm, giãn vầng trán. Bình yên khởi lên từ đó.",
      "Lúc này, nơi duy nhất bạn cần có mặt là chính ở đây.",
    ],
    buddy: [
      "Xong rồi nha, nghỉ cái đã. Việc có chạy đi đâu mà lo.",
      "Đứng lên duỗi cái lưng coi, ngồi lâu quá rồi đó.",
      "Làm ngụm cà phê hay miếng bánh gì không? Tự thưởng tí đi.",
      "Thôi tắt não chút nha, {sessions_today} phiên rồi còn gì.",
      "Đi vòng vòng cho giãn gân cốt nè, đừng dán mắt vô máy nữa.",
      "Nghỉ cho thiệt á, đừng có lén mở việc ra coi đó nha.",
      "Mệt thì nằm thẳng cẳng năm phút, sướng phải biết.",
      "Nãy giờ chiến dữ rồi, tới giờ lười hợp pháp nè.",
      "Ra ban công hít tí khí trời cho tỉnh người đi bạn.",
      "Cho mắt nghỉ tí coi, ngó ra xa cái gì xanh xanh ấy.",
      "Việc mai làm tiếp, giờ này là của bạn thôi.",
      "Bật bài nhạc nhẹ, thả lỏng cái, đã gì đâu.",
      "Mấy phút này khỏi nghĩ ngợi gì hết, cứ thở cho khỏe.",
      "Pin tụt rồi kìa, sạc lại tí rồi quẩy tiếp nha.",
    ],
  },
};

// ----- Agent 4: Ngân hàng từ đồng nghĩa và từ đệm -----
export const SYNONYMS = {
  tot: ["ổn", "ổn áp", "ngon", "ngon lành", "tốt", "khá ổn", "đâu vào đấy", "vào guồng rồi", "mượt", "trơn tru", "đang chạy tốt", "êm"],
  tiep_tuc: ["đi tiếp", "chạy tiếp", "giữ nhịp", "tiếp nào", "làm nốt", "đẩy thêm chút", "kéo tiếp", "giữ đà", "đi nốt đoạn này", "tiếp tục giữ", "bám tiếp", "theo nhịp này"],
  nghi_ngoi: ["nghỉ chút", "thả lỏng", "ngồi nghỉ", "dừng một lát", "hạ nhịp", "buông ra một tí", "nghỉ tay", "giãn ra", "thở một hơi", "ngơi một chút", "tạm dừng", "để đầu trống một lát"],
  tap_trung: ["tập trung", "dồn vào", "gom sự chú ý", "để tâm vào", "chú tâm", "khoá vào một việc", "giữ mắt ở đây", "đặt hết vào đó", "không rời việc", "vào sâu", "chăm chú", "ghim vào một thứ"],
  hoan_thanh: ["xong rồi", "hoàn thành", "khép lại", "chốt phiên", "làm trọn", "kết phiên", "đóng lại được rồi", "tới đích", "trọn một phiên", "gói lại", "xong một chặng", "đủ một phiên"],
  co_len: ["thêm chút nữa thôi", "gần tới rồi", "còn một đoạn ngắn", "bạn làm được mà", "cứ từ từ là tới", "đã đi được kha khá", "không xa nữa đâu", "giữ vậy là ổn", "nhẹ nhàng thôi", "một bước nữa là tới"],
  openers: ["Nào", "Rồi", "Được", "Này", "Ờ", "Ổn", "Bắt đầu nhé", "Vào việc thôi", "Nghe này", "Tới rồi", "Vậy là", "Thôi nào", "Khoan đã", "Để ý chút"],
  fillers: ["nhé", "nha", "đấy", "thôi", "đi", "đó", "mà", "vậy", "ha", "luôn", "đó nha", "chứ"],
  softeners: ["một chút thôi", "không cần vội", "từ từ cũng được", "nhẹ nhàng thôi", "không sao đâu", "cứ thong thả", "chậm lại cũng ổn", "đừng ép mình", "vừa sức là được", "lúc nào sẵn sàng cũng được"],
};

// ----- Agent 3: Nguyên liệu giọng cho tone modulator -----
export const TONE = {
  strict: {
    openers: ["Vào việc.", "Nghe đây.", "Tập trung.", "Bắt đầu ngay.", "Không lan man.", "Làm thôi.", "Đủ rồi, quay lại.", "Một việc, lúc này.", "Giữ nhịp."],
    closers: ["Làm đi.", "Xong phiên này đã.", "Không bàn lại.", "Giữ đúng kỷ luật.", "Tiếp tục.", "Không dừng nửa chừng.", "Đóng cửa, làm việc.", "Hết giờ mới nghỉ.", "Cứ thế mà chạy."],
    words: ["dứt khoát", "kỷ luật", "tập trung", "nhịp", "đủ rồi", "ngay", "giữ", "không lan man", "vào việc", "rõ ràng", "chắc tay", "đúng giờ"],
    emoji: [],
  },
  zen: {
    openers: ["Hít một hơi.", "Chậm lại đã.", "Ngồi yên một chút.", "Cảm nhận hơi thở.", "Có mặt ở đây.", "Buông nhẹ vai xuống.", "Một khoảng lặng.", "Để tâm lắng lại.", "Quay về với phút này."],
    closers: ["Cứ nhẹ nhàng thôi.", "Một hơi thở nữa rồi tiếp.", "Để mọi thứ tự lắng.", "An trú nơi việc đang làm.", "Không vội, có mặt là đủ.", "Thở ra, rồi bắt đầu.", "Tâm tĩnh, việc tự xuôi.", "Nhẹ tay, nhẹ lòng.", "Mỗi phút là một hơi thở."],
    words: ["hơi thở", "tĩnh", "chậm", "có mặt", "buông", "lắng", "nhẹ", "an", "khoảng lặng", "phút này", "hiện diện", "thảnh thơi"],
    emoji: ["🌿", "🍃", "🌊"],
  },
  buddy: {
    openers: ["Ê, ngon đó!", "Quay lại nào.", "Tới luôn nha.", "Nãy giờ ổn ghê.", "Mình làm tiếp nhé.", "Đi tiếp thôi bồ.", "Khá lắm đó nha.", "Nào, mình bắt nhịp lại.", "Ngồi vào là chiến liền."],
    closers: ["Cứ thế nha bồ!", "Đỉnh đó, làm tiếp đi.", "Mình tin bạn mà.", "Chút nữa nghỉ cũng được.", "Quẩy nốt phiên này nào.", "Ngon, giữ phong độ nha.", "Bạn làm được mà, đi!", "Tí xíu nữa thôi à.", "Cố nốt rồi mình thưởng nha."],
    words: ["bồ", "ngon", "ghê", "tới luôn", "quẩy", "đỉnh", "mình", "nha", "ổn áp", "khá lắm", "chill", "nhẹ nhàng"],
    emoji: ["😄", "👍", "🔥", "✨"],
  },
};

// ----- Agent 11: Copy cho tình huống biên -----
export const EDGE_CASES = [
  {
    id: "repeated_interruptions",
    when: "Phiên bị gián đoạn liên tục nhiều lần",
    intent: "remind",
    strict: [
      "Lần nữa rồi. Đặt điện thoại úp xuống, ta bắt đầu lại từ đây.",
      "Mạch đang đứt vì những thứ nhỏ. Chọn một việc, khoá phần còn lại.",
      "Không sao, nhưng đừng để nó thành thói quen. Tập trung lại, ngay bây giờ.",
    ],
    zen: [
      "Bị kéo ra ngoài cũng không sao. Hít một hơi, rồi nhẹ nhàng quay về.",
      "Mỗi lần xao động là một lần được tập quay lại. Mình thử lần nữa nhé.",
      "Tâm cứ trôi đi rồi mình lại dẫn về, như dắt một dòng nước. Cứ từ tốn.",
    ],
    buddy: [
      "Hôm nay đời cứ gọi cửa hoài ha. Mình tắt bớt một cửa rồi làm tiếp nhé.",
      "Bị ngắt mấy lần rồi đó, mà không sao đâu. Quay lại chỗ cũ thôi.",
      "Thấy bạn bị giật ra liên tục, mệt thiệt. Để yên cái này lại một chút coi sao?",
    ],
  },
  {
    id: "late_night",
    when: "Làm việc khuya quá giờ, đã nhiều phiên trong ngày",
    intent: "relax",
    strict: [
      "Đủ cho hôm nay. {sessions_today} phiên là tốt, giờ đi ngủ.",
      "Khuya rồi. Cố thêm lúc này là vay nợ ngày mai.",
      "Dừng tay. Việc còn đó, sức thì cạn rồi.",
    ],
    zen: [
      "Đêm đã sâu rồi. Mình cho phép tay nghỉ, cho mắt khép lại.",
      "Hôm nay đã trọn vẹn. Buông cái màn hình xuống, để cơ thể được tối.",
      "Khuya thế này, điều tử tế nhất là một giấc ngủ. Mình về với hơi thở nhé.",
    ],
    buddy: [
      "Khuya lắc rồi nha trùm. {sessions_today} phiên là quá đỉnh, đi ngủ thôi.",
      "Trời ơi giờ này còn cày. Để mai làm tiếp, giờ đắp chăn cái đã.",
      "Mắt bạn chắc cay rồi đó. Tắt đèn nha, mai mình chiến tiếp.",
    ],
  },
  {
    id: "long_break_return",
    when: "Nghỉ rất lâu rồi mới quay lại",
    intent: "encourage",
    strict: [
      "Quay lại là được. Bắt đầu bằng một phiên, không cần nhiều.",
      "Nghỉ bao lâu không quan trọng. Quan trọng là phút này bạn ngồi xuống.",
      "Không tính sổ quá khứ. Một phiên ngay bây giờ, đi.",
    ],
    zen: [
      "Bạn trở lại rồi, vậy là đủ. Mình bắt đầu thật nhẹ, một hơi thở thôi.",
      "Khoảng nghỉ dài cũng là một phần của hành trình. Giờ ta lại đây, an yên.",
      "Không cần đuổi theo những ngày đã qua. Chỉ cần có mặt, ngay lúc này.",
    ],
    buddy: [
      "Ơ trở lại rồi nè, nhớ bạn ghê. Làm một phiên nhẹ cho ấm máy đã.",
      "Lâu rồi không gặp ha. Đừng lo chuyện cũ, mình khởi động lại từ đầu thôi.",
      "Quay lại là vui rồi đó. Một phiên nhỏ xíu thôi, không áp lực gì hết.",
    ],
  },
  {
    id: "streak_broken",
    when: "Chuỗi vừa đứt, streak_days về 0 sau khi từng lên cao",
    intent: "encourage",
    strict: [
      "Chuỗi đứt thì xây lại. Hôm nay là ngày một, làm cho tốt.",
      "Một con số reset thôi, không phải bạn. Ngồi xuống, bắt đầu.",
      "Quá khứ {streak_days} ngày vẫn là sức của bạn. Giờ dựng chuỗi mới.",
    ],
    zen: [
      "Chuỗi dừng lại cũng không mất gì. Những ngày đã tập vẫn ở trong bạn.",
      "Như dòng sông gặp khúc cạn rồi lại chảy. Mình bắt đầu lại, dịu dàng.",
      "Đừng nắm chặt con số đã rơi. Buông nó, rồi đặt bước đầu tiên hôm nay.",
    ],
    buddy: [
      "Ơ đứt chuỗi rồi à, không sao đâu mà, ai cũng có ngày hụt.",
      "Streak về 0 nhưng bạn đâu có về 0. Mình gầy lại từ hôm nay nha.",
      "Thôi bỏ qua đi, đừng tự trách. Một phiên hôm nay là ngày một rồi đó.",
    ],
  },
  {
    id: "first_session",
    when: "Phiên đầu tiên của người mới",
    intent: "encourage",
    strict: [
      "Phiên đầu tiên. Đặt một việc, làm trong hai mươi lăm phút, vậy thôi.",
      "Khởi đầu không cần hoàn hảo, cần bắt đầu. Bấm vào đi.",
      "Mọi chuỗi dài đều mở bằng một phiên. Đây là phiên đó.",
    ],
    zen: [
      "Chào bạn. Mình cùng nhau ngồi xuống, hít một hơi, rồi bắt đầu.",
      "Phiên đầu tiên như hạt giống đầu. Cứ nhẹ nhàng, không vội.",
      "Không cần biết sẽ đi xa đến đâu. Lúc này, chỉ cần một hơi thở và sự có mặt.",
    ],
    buddy: [
      "Ô người mới nè, chào mừng nha. Mình làm thử một phiên cho biết mùi.",
      "Lần đầu hả, dễ ợt à. Chọn một việc rồi bấm nút, để tui canh giờ cho.",
      "Bắt đầu rồi đó, mừng quá. Không cần gồng đâu, cứ hai mươi lăm phút thôi.",
    ],
  },
  {
    id: "deep_flow",
    when: "Vào mạch sâu, nhiều phiên liên tiếp không gián đoạn",
    intent: "acknowledge",
    strict: [
      "{sessions_today} phiên, không một lần đứt. Đây là phong độ thật.",
      "Bạn đang ở trong vùng tập trung. Giữ nguyên, đừng đụng vào nó.",
      "Liền mạch như vầy là kết quả của kỷ luật. Ghi nhận.",
    ],
    zen: [
      "Bạn đang chảy trôi rất êm, không vướng víu. Cứ ở yên trong đó.",
      "Tâm và việc đã thành một dòng. Đẹp lắm, mình không cần nói thêm.",
      "Sự tĩnh lặng này quý lắm. Mình lặng lẽ ở bên, để bạn tiếp tục.",
    ],
    buddy: [
      "Trời ơi {sessions_today} phiên liền không nghỉ, bạn đang bốc cháy đó.",
      "Mạch ngon quá trời, không lỗi nhịp nào luôn. Đừng dừng nha, tới đi.",
      "Đang trong zone rồi nè, tui im đây cho bạn bay. Đỉnh thiệt sự.",
    ],
  },
];

/* =====================================================================
   Tiện ích chung
   ===================================================================== */
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
function pickRandom(arr) {
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

/* =====================================================================
   ===== Agent 7: Context Scorer =====
   scoreContext(context) -> { energy_level, momentum, struggle_score, fatigue }
   Mỗi chỉ số 0-100, logic giải thích được, không random.

   Bảng ngưỡng ý nghĩa:
     energy_level  : 0-30 cạn kiệt | 31-60 tạm ổn | 61-100 dồi dào
     momentum      : 0-30 chưa có đà | 31-65 đang lên | 66-100 đà mạnh
     struggle_score: 0-25 mượt | 26-55 hơi rối | 56-100 vất vả
     fatigue       : 0-30 còn khỏe | 31-60 chớm mệt | 61-100 mệt
   ===================================================================== */
const ENERGY_BY_TIME = { morning: 85, noon: 60, afternoon: 70, evening: 55, night: 35 };
const FATIGUE_BY_TIME = { morning: 0, noon: 8, afternoon: 6, evening: 18, night: 35 };

export function scoreContext(context = {}) {
  const {
    time_of_day = "morning",
    sessions_today = 0,
    interruptions = 0,
    streak_days = 0,
    total_focus_minutes = 0,
  } = context;

  // energy: nền tảng theo giờ, trừ dần theo số phiên đã làm
  const energyBase = ENERGY_BY_TIME[time_of_day] ?? 60;
  const energy_level = clamp(energyBase - Math.min(sessions_today * 4, 30));

  // momentum: chuỗi ngày + số phiên hôm nay
  const momentum = clamp(Math.min(streak_days * 8, 55) + Math.min(sessions_today * 8, 45));

  // struggle: theo số lần gián đoạn (1->22, 2->44, 3->66, 4->88, 5+->100)
  const struggle_score = clamp(Math.min(interruptions * 22, 100));

  // fatigue: phiên tích lũy + giờ muộn + tổng giờ dài
  const fatigueBase = Math.min(sessions_today * 9, 55);
  const fatigueTime = FATIGUE_BY_TIME[time_of_day] ?? 0;
  const fatigueLong = Math.min(Math.floor(total_focus_minutes / 60) * 4, 20);
  const fatigue = clamp(fatigueBase + fatigueTime + fatigueLong);

  return { energy_level, momentum, struggle_score, fatigue };
}

/* =====================================================================
   ===== Agent 9: Rule Base Focus =====
   Luật bổ trợ cho Intent Selector trong ngữ cảnh focus.
   Trả về { intent, hint } hoặc null.
   ===================================================================== */
function focusRules(context, score) {
  const { event, sessions_today = 0, interruptions = 0 } = context;
  const { momentum, struggle_score } = score;

  if (event === "interrupted") return { intent: "remind", hint: "dang_gian_doan" };

  if (event === "session_end") {
    if (struggle_score >= 56) return { intent: "remind", hint: "xong_nhung_vat_va" };
    if (sessions_today >= 4 && interruptions === 0) return { intent: "acknowledge", hint: "lien_mach_dai" };
    return { intent: "acknowledge", hint: "xong_phien" };
  }

  if (event === "session_start") {
    if (sessions_today === 0) return { intent: "encourage", hint: "phien_dau_ngay" };
    if (momentum >= 66) return { intent: "encourage", hint: "da_manh" };
    return { intent: "encourage", hint: "giua_chuoi" };
  }

  return null;
}

/* =====================================================================
   ===== Agent 10: Rule Base Break =====
   Luật cho phiên nghỉ (short_break, long_break).
   ===================================================================== */
function breakRules(context) {
  const { phase, time_of_day, sessions_today = 0 } = context;
  if (phase !== "short_break" && phase !== "long_break") return null;

  if (time_of_day === "night" && sessions_today >= 3) return { intent: "relax", hint: "nghi_cuoi_ngay" };
  if (phase === "long_break") return { intent: "relax", hint: "nghi_dai" };
  return { intent: "relax", hint: "nghi_ngan" };
}

/* =====================================================================
   ===== Agent 8: Intent Selector =====
   selectIntent(context, score) -> một trong 4 intent.
   Ưu tiên: break > luật focus > fallback theo điểm.
   ===================================================================== */
export function selectIntent(context = {}, score = scoreContext(context)) {
  const br = breakRules(context, score);
  if (br) return br.intent;

  const fr = focusRules(context, score);
  if (fr) return fr.intent;

  if (score.struggle_score >= 56) return "remind";
  if (context.phase === "short_break" || context.phase === "long_break") return "relax";
  if (score.momentum >= 50) return "encourage";
  return "encourage";
}

/* =====================================================================
   ===== Agent 1: Template Engine =====
   fillTemplate(template, context) -> string đã điền biến.
   Placeholder: {sessions_today} {streak_days} {total_focus_minutes}

   Xử lý đơn vị tiếng Việt THÔNG MINH theo ngữ cảnh chữ xung quanh:
   - "phiên thứ {sessions_today}" -> "phiên thứ 4"  (số trần)
   - "Đủ {sessions_today} phiên"  -> "Đủ 4 phiên"   (đơn vị đã có sẵn)
   - "{sessions_today} đã xong"   -> "4 phiên đã xong" (tự thêm đơn vị)
   - {total_focus_minutes} -> "1 giờ 30 phút"
   Nếu thiếu dữ liệu, dùng từ thay thế mượt, không lộ "undefined".
   ===================================================================== */
function fmtMinutes(m) {
  m = Math.max(0, Math.round(m));
  if (m < 60) return m + " phút";
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? h + " giờ" : h + " giờ " + r + " phút";
}

function expandPlaceholder(name, context, before, after) {
  const v = context[name];

  if (name === "sessions_today") {
    const unitFollows = /^\s*(phiên|lần|buổi)\b/i.test(after);
    const ordinalBefore = /\bthứ\s*$/i.test(before);
    if (!isNum(v) || v <= 0) return unitFollows || ordinalBefore ? "vài" : "vài phiên";
    return unitFollows || ordinalBefore ? String(v) : v + " phiên";
  }

  if (name === "streak_days") {
    const unitFollows = /^\s*ngày\b/i.test(after);
    if (!isNum(v) || v <= 0) return unitFollows ? "vài" : "vài ngày";
    return unitFollows ? String(v) : v + " ngày";
  }

  if (name === "total_focus_minutes") {
    if (!isNum(v) || v <= 0) return "một chút";
    return fmtMinutes(v);
  }

  return "";
}

export function fillTemplate(template = "", context = {}) {
  let out = String(template).replace(
    /\{(sessions_today|streak_days|total_focus_minutes)\}/g,
    (m, name, offset, full) => {
      const before = full.slice(0, offset);
      const after = full.slice(offset + m.length);
      return expandPlaceholder(name, context, before, after);
    }
  );

  // Dọn placeholder lạ (nếu có) và gộp đơn vị bị lặp (phòng thủ)
  out = out
    .replace(/\{[a-z_]+\}/gi, "")
    .replace(/\b(phiên)\s+phiên\b/gi, "$1")
    .replace(/\b(ngày)\s+ngày\b/gi, "$1")
    .replace(/\b(phút)\s+phút\b/gi, "$1")
    .replace(/\b(giờ)\s+giờ\b/gi, "$1");

  return out;
}

/* Các placeholder mà một template cần có dữ liệu */
function templatePlaceholders(t) {
  return (String(t).match(/\{(sessions_today|streak_days|total_focus_minutes)\}/g) || []).map((x) => x.slice(1, -1));
}
function isSatisfiable(t, context) {
  if (!context) return true;
  for (const name of templatePlaceholders(t)) {
    const v = context[name];
    if (!isNum(v) || v <= 0) return false;
  }
  return true;
}
function filterSatisfiable(pool, context) {
  if (!context) return pool;
  const ok = pool.filter((t) => isSatisfiable(t, context));
  return ok.length ? ok : pool;
}

/* =====================================================================
   ===== Agent 5: Sentence Assembler =====
   Ghép mở đầu / thân / đuôi thành câu đúng ngữ pháp tiếng Việt:
   viết hoa đầu câu, một dấu câu cuối, bỏ khoảng trắng thừa.
   ===================================================================== */
function capitalizeFirst(s) {
  const m = String(s).match(/^(\s*)([\s\S]*)$/);
  const lead = m[1];
  const rest = m[2];
  // Chỉ viết hoa khi ký tự đầu tiên là chữ cái. Nếu câu mở đầu bằng số
  // (vd "4 phiên...", "1 giờ 30 phút...") thì giữ nguyên, không viết hoa từ sau.
  if (rest && /[A-Za-zÀ-ỹ]/.test(rest[0])) {
    return lead + rest[0].toUpperCase() + rest.slice(1);
  }
  return s;
}

function tidy(s) {
  let out = String(s)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?…])/g, "$1")
    .replace(/([,;:])(?=\S)/g, "$1 ")
    .trim();
  out = out.replace(/([.!?])\1+/g, "$1");
  if (out && !/[.!?…]$/.test(out)) out += ".";
  return capitalizeFirst(out);
}

export function assembleSentence({ opener = "", body = "", closer = "" } = {}) {
  return tidy([opener, body, closer].filter((p) => p && p.trim()).join(" "));
}

/* =====================================================================
   ===== Agent 4 (lookup): rút ngẫu nhiên một biến thể từ =====
   ===================================================================== */
export function pickSyn(key) {
  return pickRandom(SYNONYMS[key]);
}

/* =====================================================================
   ===== Agent 3: Tone Modulator =====
   applyTone(sentence, personality) -> câu đã nhuốm giọng.
   Nội dung vốn đã đúng giọng nên tầng này chạm NHẸ, không chồng chất.
   - strict: bỏ từ đệm mềm, hạ bớt dấu cảm, giữ gọn dứt khoát.
   - zen: thi thoảng thêm một mở đầu tĩnh tại.
   - buddy: thi thoảng thêm một tiểu từ thân mật ở cuối.
   Không thêm câu mới, không vượt quá 2 câu. Không chèn emoji ở đây
   (emoji do Agent 6 lo, đặt sau cùng).
   ===================================================================== */
function endsWithFiller(s) {
  return /\b(nhé|nha|ha|đó|nào|thôi|đấy|nè|à)\s*[.!?…]?$/i.test(s);
}
function sentenceCount(s) {
  return (String(s).match(/[.!?…]+/g) || []).length || 1;
}
function startsWithOpener(s) {
  return /^[A-Za-zÀ-ỹ][^,]{0,12},/.test(s.trim());
}
function insertBeforeTerminal(s, frag) {
  const m = s.match(/([.!?…]+)\s*$/);
  if (!m) return s + " " + frag;
  return s.slice(0, m.index).trimEnd() + " " + frag + m[1];
}

const TONE_RATE = {
  strict: { opener: 0.0, closer: 0.0 },
  zen: { opener: 0.16, closer: 0.0 },
  buddy: { opener: 0.0, closer: 0.22 },
};

export function applyTone(sentence, personality = "buddy") {
  let out = String(sentence).trim();
  const rate = TONE_RATE[personality] || TONE_RATE.buddy;
  const tone = TONE[personality] || TONE.buddy;

  if (personality === "strict") {
    // Cắt từ đệm mềm, hạ một số dấu cảm thành chấm cho dứt khoát
    out = out.replace(/\s*\b(nhé|nha|nhe|ha|nè)\b/gi, "");
    out = out.replace(/!/g, ".");
    return tidy(out);
  }

  // zen: thêm một mở đầu tĩnh tại (là một câu ngắn riêng). Chỉ thêm khi câu
  // gốc đang là MỘT câu, để tổng không vượt quá 2 câu, và giữ nguyên viết hoa.
  if (
    personality === "zen" &&
    Math.random() < rate.opener &&
    sentenceCount(out) === 1 &&
    !startsWithOpener(out)
  ) {
    const op = pickRandom(tone.openers);
    if (op) out = tidy(op) + " " + out;
  }

  // buddy: thêm một tiểu từ thân mật ở cuối nếu chưa có
  if (personality === "buddy" && Math.random() < rate.closer && !endsWithFiller(out)) {
    out = insertBeforeTerminal(out, pickRandom(["nha", "nhé", "đó"]));
  }

  return tidy(out);
}

/* =====================================================================
   ===== Agent 6: Naturalizer =====
   Lớp "chất người" cuối cùng. Tối đa MỘT hiệu ứng, có xác suất, và có
   các trường hợp không được chạm vào để tránh lạm dụng.
   - remind + bất kỳ giọng: không đùa cợt, giữ sự tôn trọng.
   - strict: giữ nguyên, không rườm rà.
   - zen / buddy: thi thoảng một mở đầu ngập ngừng rất nhẹ.
   - emoji rất tiết chế, đặt sau cùng (sau dấu câu).
   ===================================================================== */
export function naturalize(sentence, meta = {}) {
  const { intent = "encourage", personality = "buddy" } = meta;
  let out = tidy(String(sentence));

  if (personality === "strict") return out;

  // Mở đầu ngập ngừng rất nhẹ, chỉ cho zen và chỉ với câu ngắn, để tránh
  // chật câu (vd "nè ... nè"). Không áp cho remind để giữ sự tôn trọng.
  if (
    personality === "zen" &&
    intent !== "remind" &&
    sentenceCount(out) === 1 &&
    !startsWithOpener(out) &&
    out.split(" ").length <= 10 &&
    Math.random() < 0.16
  ) {
    const soft = pickRandom(["Nhẹ nhàng thôi,", "Cứ từ từ,", "Khẽ thôi,"]);
    out = tidy(soft + " " + out.charAt(0).toLowerCase() + out.slice(1));
  }

  // Emoji tiết chế, đặt sau cùng. Không cho remind. Strict đã return ở trên.
  if (intent !== "remind") {
    const tone = TONE[personality] || TONE.buddy;
    const emojiRate = personality === "zen" ? 0.1 : 0.18;
    if (tone.emoji && tone.emoji.length && Math.random() < emojiRate) {
      out = out + " " + pickRandom(tone.emoji);
    }
  }

  return out;
}

/* =====================================================================
   ===== Agent 17: Anti-Repeat Tracker =====
   Quản lý usedList để chống nói lặp. markUsed / isRecentlyUsed,
   reset thông minh khi hết biến thể, tối ưu bộ nhớ khi chạy lâu.
   ===================================================================== */
const DEFAULT_WINDOW = 24;

export function createCoachMemory() {
  return {
    used: [],          // template đã dùng gần đây (Agent 17)
    sessionLog: [],    // lịch sử phiên trong ngày (Agent 16)
    recentIntents: [], // intent gần đây (Agent 18)
    window: DEFAULT_WINDOW,
  };
}

export function isRecentlyUsed(memory, templateId, window) {
  if (!memory || !memory.used) return false;
  const w = window || memory.window || DEFAULT_WINDOW;
  return memory.used.slice(-w).includes(templateId);
}

export function markUsed(memory, templateId) {
  if (!memory) return;
  if (!memory.used) memory.used = [];
  memory.used.push(templateId);
  const cap = (memory.window || DEFAULT_WINDOW) * 2;
  if (memory.used.length > cap) memory.used = memory.used.slice(-cap);
}

/* =====================================================================
   ===== Agent 2: Variation System =====
   pickTemplate(intent, personality, usedList[, context]) -> template chưa dùng.
   - Lọc theo dữ liệu khả dụng (context) để không điền "chuỗi 0 ngày".
   - Ưu tiên template chưa nằm trong usedList.
   - Hết sạch thì reset thông minh, tránh dùng lại câu vừa nói.
   ===================================================================== */
export function pickTemplate(intent, personality, usedList = [], context = null) {
  let pool =
    (CONTENT[intent] && CONTENT[intent][personality]) ||
    (CONTENT[intent] && CONTENT[intent].buddy) ||
    [];
  if (pool.length === 0) return "Mình ở đây cùng bạn.";

  pool = filterSatisfiable(pool, context);

  const used = new Set(usedList);
  const fresh = pool.filter((t) => !used.has(t));
  if (fresh.length > 0) return pickRandom(fresh);

  // Hết biến thể: reset thông minh, tránh câu vừa dùng gần nhất
  const last = usedList[usedList.length - 1];
  const others = pool.filter((t) => t !== last);
  return pickRandom(others.length ? others : pool);
}

/* Chọn một câu từ một mảng bất kỳ (dùng cho edge case copy) */
function pickFromPool(pool, usedList = [], context = null) {
  if (!pool || !pool.length) return null;
  const filtered = filterSatisfiable(pool, context);
  const used = new Set(usedList);
  const fresh = filtered.filter((t) => !used.has(t));
  return pickRandom(fresh.length ? fresh : filtered);
}

/* =====================================================================
   ===== Agent 16: Session Memory =====
   Ghi và đọc lịch sử phiên trong ngày (runtime, không localStorage).
   ===================================================================== */
export function recordSession(memory, context) {
  if (!memory) return;
  if (!memory.sessionLog) memory.sessionLog = [];
  memory.sessionLog.push({
    phase: context.phase,
    event: context.event,
    time_of_day: context.time_of_day,
    interruptions: context.interruptions || 0,
    sessions_today: context.sessions_today || 0,
  });
  if (memory.sessionLog.length > 60) memory.sessionLog = memory.sessionLog.slice(-60);
}

export function getSessionHistory(memory) {
  return (memory && memory.sessionLog) || [];
}

/* =====================================================================
   ===== Agent 18: Pattern Detector =====
   Nhận định mức cao qua nhiều phiên để cá nhân hóa phản hồi.
   ===================================================================== */
export function detectPatterns(memory) {
  const log = getSessionHistory(memory);
  const insights = [];
  if (log.length < 3) return insights;

  // Hay bị gián đoạn vào một buổi nào đó
  const byTime = {};
  for (const s of log) {
    if (!byTime[s.time_of_day]) byTime[s.time_of_day] = { n: 0, interr: 0 };
    byTime[s.time_of_day].n += 1;
    byTime[s.time_of_day].interr += s.interruptions;
  }
  for (const [t, v] of Object.entries(byTime)) {
    if (v.n >= 2 && v.interr / v.n >= 2) insights.push({ tag: "hay_gian_doan", time: t });
  }

  // Chuỗi gián đoạn liên tiếp gần đây
  const recent = log.slice(-3);
  if (recent.length === 3 && recent.every((s) => (s.interruptions || 0) >= 2)) {
    insights.push({ tag: "gian_doan_lien_tiep" });
  }

  return insights;
}

/* =====================================================================
   ===== Agent 11: Edge Case Handler (phát hiện) =====
   Trả về edge case khớp hoặc null. Ưu tiên từ nặng đến nhẹ.
   ===================================================================== */
function byId(id) {
  return EDGE_CASES.find((c) => c.id === id) || null;
}

export function detectEdgeCase(context = {}, memory = null) {
  const {
    phase, event,
    sessions_today = 0, interruptions = 0, streak_days = 0,
    total_focus_minutes = 0, time_of_day,
  } = context;

  const patterns = detectPatterns(memory);
  const repeated = patterns.some((p) => p.tag === "gian_doan_lien_tiep");

  if ((interruptions >= 3 || repeated) && phase === "focus") return byId("repeated_interruptions");
  if (time_of_day === "night" && sessions_today >= 4) return byId("late_night");
  if (event === "session_start" && sessions_today <= 1 && total_focus_minutes <= 25 && streak_days <= 0) return byId("first_session");
  if (event === "session_start" && streak_days === 0 && total_focus_minutes >= 120) return byId("streak_broken");
  // deep_flow chỉ xét trong phiên focus, không cướp intent của phiên nghỉ
  if (event === "session_end" && phase === "focus" && sessions_today >= 4 && interruptions === 0) return byId("deep_flow");
  return null;
}

/* =====================================================================
   Tone descriptor cho CoachOutput.tone
   ===================================================================== */
const TONE_LABEL = {
  strict: { _base: "dứt khoát", remind: "nghiêm mà tôn trọng", relax: "điềm tĩnh", acknowledge: "ghi nhận rõ ràng", encourage: "thúc đẩy" },
  zen: { _base: "tĩnh tại", encourage: "nhẹ nhàng", relax: "thư thái", remind: "ôn hòa", acknowledge: "an lành" },
  buddy: { _base: "thân tình", encourage: "hào hứng", acknowledge: "vui vẻ", remind: "nhẹ nhõm", relax: "thoải mái" },
};
function toneLabel(personality, intent) {
  const m = TONE_LABEL[personality] || TONE_LABEL.buddy;
  return m[intent] || m._base;
}

/* =====================================================================
   ===== Hàm tổng hợp: generateCoachMessage =====
   generateCoachMessage(context, personality, memory) -> CoachOutput
   Luồng đầy đủ: chấm điểm -> ghi nhớ -> phát hiện edge -> chọn intent
   -> lấy template chưa lặp -> điền biến -> nhuốm giọng -> tự nhiên hóa.
   ===================================================================== */
export function generateCoachMessage(context = {}, personality = "buddy", memory = null) {
  const mem = memory || createCoachMemory();
  const pers = CONTENT.encourage[personality] ? personality : "buddy";

  // 1. Chấm điểm ngữ cảnh (Agent 7)
  const score = scoreContext(context);

  // 2. Ghi lịch sử phiên (Agent 16)
  recordSession(mem, context);

  // 3. Phát hiện tình huống biên (Agent 11)
  const edge = detectEdgeCase(context, mem);

  // 4. Chọn intent (Agent 8 9 10, hoặc theo edge)
  const intent = edge ? edge.intent : selectIntent(context, score);

  // 5. Lấy template chưa lặp (Agent 2 17)
  let template;
  if (edge) {
    const pool = edge[pers] || edge.buddy;
    template = pickFromPool(pool, mem.used, context) || pickTemplate(intent, pers, mem.used, context);
  } else {
    template = pickTemplate(intent, pers, mem.used, context);
  }

  // 6. Điền biến (Agent 1)
  const filled = fillTemplate(template, context);

  // 7. Nhuốm giọng (Agent 3)
  const toned = applyTone(filled, pers);

  // 8. Tự nhiên hóa (Agent 6)
  const message = naturalize(toned, { intent, personality: pers, score });

  // 9. Cập nhật trí nhớ chống lặp (Agent 17 18)
  markUsed(mem, template);
  mem.recentIntents.push(intent);
  if (mem.recentIntents.length > 30) mem.recentIntents = mem.recentIntents.slice(-30);

  return {
    message,
    intent,
    tone: toneLabel(pers, intent),
  };
}

export default {
  scoreContext,
  selectIntent,
  pickTemplate,
  fillTemplate,
  applyTone,
  naturalize,
  assembleSentence,
  pickSyn,
  generateCoachMessage,
  createCoachMemory,
  markUsed,
  isRecentlyUsed,
  recordSession,
  getSessionHistory,
  detectPatterns,
  detectEdgeCase,
  CONTENT,
  SYNONYMS,
  TONE,
  EDGE_CASES,
};
