import type { ConceptGuide } from '@/types/content';

/**
 * Hướng dẫn kiến thức Khu vực 5 — if–else và tổng hợp.
 *
 * Khu vực này có hai nhiệm vụ sư phạm:
 *   1. Phân biệt "hai khối if rời" với "một cấu trúc if–else" — khác biệt về Ý
 *      NGHĨA, không phải về cú pháp.
 *   2. Dạy cách CHIA một bài toán lớn thành ba loại việc quen thuộc: việc đặt
 *      tên được (hàm), việc lặp lại (for), việc phải quyết định (if–else).
 */
export const lesson5Guide: ConceptGuide = {
  lessonId: 'l5',
  bigQuestion:
    'Hai khối if viết liền nhau với một cấu trúc if–else — nhìn thì na ná, nhưng khác nhau ở đâu? Và khi gặp một bài toán lớn, em bắt đầu từ đâu?',

  problem: {
    title: 'Hai khối if rời nhau không hề biết tới sự tồn tại của nhau',
    body: 'Em muốn phân loại phép thuật thành "mạnh" hoặc "yếu" — chỉ một trong hai, không bao giờ cả hai. Nếu viết bằng hai khối `if` riêng, mỗi khối tự kiểm tra điều kiện của mình mà không quan tâm khối kia. Chỉ cần em viết hai điều kiện chồng lấn nhau, cả hai cùng đúng, và chương trình in ra cả hai kết luận trái ngược nhau.',
    painfulExample: `int magicPower = 60;

if (magicPower >= 50) {
    cout << "Phep thuat manh" << endl;
}

if (magicPower < 100) {
    cout << "Phep thuat yeu" << endl;
}

// Kết quả: in ra CẢ HAI dòng!
// 60 >= 50 đúng, mà 60 < 100 cũng đúng.
// Chương trình vừa bảo mạnh vừa bảo yếu.`,
    punchline:
      'Lỗi này không nằm ở cú pháp — code hoàn toàn hợp lệ. Nó nằm ở chỗ em chưa nói cho máy tính biết rằng hai trường hợp này loại trừ nhau.',
  },

  solution: {
    title: '`else` nghĩa là "tất cả những trường hợp còn lại"',
    body: 'Khi nối hai nhánh bằng `else`, em ra một lời hứa với máy tính: đúng một trong hai sẽ chạy, không bao giờ cả hai, cũng không bao giờ không nhánh nào. Và có một cái lợi kín đáo hơn: em không phải viết điều kiện thứ hai nữa. `else` tự động phủ hết phần còn lại, nên không thể có kẽ hở hay chồng lấn.',
    cleanExample: `int magicPower = 60;

if (magicPower >= 50) {
    cout << "Phep thuat manh" << endl;
} else {
    cout << "Phep thuat yeu" << endl;
}

// Chỉ in ra "Phep thuat manh".
// Không cần viết điều kiện < 50 cho nhánh else —
// "còn lại" tự nó đã là < 50 rồi.`,
    whatChanged:
      'Một điều kiện biến mất, và cùng với nó là mọi nguy cơ viết chồng lấn hay bỏ sót trường hợp.',
  },

  mentalModel: {
    analogy: 'if–else là một ngã ba đường; hai khối if rời là hai câu hỏi độc lập.',
    explanation:
      'Tới ngã ba, em buộc phải chọn một nhánh và không thể đi cả hai. Còn hai khối `if` rời giống hai người khác nhau hỏi em hai câu — em có thể trả lời "có" với cả hai, hoặc "không" với cả hai. Khi hai trường hợp loại trừ nhau, hãy dùng ngã ba.',
  },

  thinkingSteps: [
    {
      question: 'Hai trường hợp này có thể cùng xảy ra không?',
      why: 'Nếu KHÔNG THỂ cùng xảy ra thì dùng `if–else`. Nếu có thể cùng xảy ra thì mới dùng hai khối `if` riêng.',
    },
    {
      question: 'Có tình huống nào mà KHÔNG nhánh nào chạy không?',
      why: 'Với `if–else` thì không bao giờ. Nếu em cần "trường hợp này thì không làm gì cả", có lẽ một `if` đơn là đủ.',
    },
    {
      question: 'Với bài toán lớn: việc nào LẶP LẠI, việc nào phải QUYẾT ĐỊNH, việc nào ĐẶT TÊN ĐƯỢC?',
      why: 'Đây là bước chia bài toán. Việc lặp lại thành `for`, việc quyết định thành `if–else`, nhóm việc đặt tên được thành hàm. Ba câu hỏi này gỡ được hầu hết bài tập ở mức lớp 8.',
    },
    {
      question: 'Cái gì nằm TRONG cái gì?',
      why: 'Quyết định lặp đi lặp lại thì `if` nằm trong `for`. Còn lặp chỉ xảy ra khi đủ điều kiện thì `for` nằm trong `if`. Vẽ ra giấy trước khi gõ.',
    },
    {
      question: 'Nếu phải giải thích chương trình này cho bạn cùng bàn, em nói thế nào?',
      why: 'Giải thích được bằng lời nghĩa là em thật sự hiểu. Nói mãi không xuôi thường là dấu hiệu chương trình đang rối và nên chia nhỏ tiếp.',
    },
  ],

  whenToUse: [
    'Dùng `if–else` khi hai trường hợp loại trừ nhau: đạt / chưa đạt, chẵn / lẻ, còn sức / hết sức',
    'Dùng `if–else` khi luôn phải có đúng một kết luận được đưa ra',
    'Đặt `if–else` bên trong `for` khi mỗi vòng lặp cần một quyết định riêng',
    'Bọc cả cụm trong một hàm có tên rõ nghĩa khi quy tắc đó được dùng lại nhiều lần',
  ],

  whenNotToUse: [
    'Đừng dùng `if–else` khi hai điều kiện có thể cùng đúng — lúc đó cần hai khối `if` riêng',
    'Đừng viết `else` rỗng chỉ cho "đủ bộ" — `if` đơn đọc dễ hơn nhiều',
    'Đừng lồng quá ba tầng `if` vào nhau; hãy tách bớt ra thành hàm có tên rõ ràng',
  ],

  misconceptions: [
    {
      wrong: 'Sau `else` cũng phải viết điều kiện, giống như sau `if`.',
      right: '`else` đứng một mình, không có ngoặc tròn và không có điều kiện.',
      why: '`else` đã mang sẵn nghĩa "tất cả trường hợp còn lại", nên viết thêm điều kiện vừa thừa vừa dễ tạo kẽ hở.',
    },
    {
      wrong: 'Hai khối `if` viết liền nhau thì cũng như `if–else`.',
      right: 'Hai khối `if` hoàn toàn độc lập: cả hai có thể cùng chạy, hoặc cùng không chạy.',
      why: 'Đây chính là bẫy ở nhiệm vụ Debug của khu vực này — code chạy ra kết quả đúng trong MỘT trường hợp, rồi sai ở trường hợp khác.',
    },
    {
      wrong: 'Bài toán lớn thì phải nghĩ ra cả chương trình rồi mới gõ được.',
      right: 'Chia nhỏ trước: đâu là việc lặp, đâu là việc quyết định, đâu là nhóm việc đặt tên được. Rồi làm từng phần một.',
      why: 'Không ai viết một mạch xong cả chương trình. Kể cả lập trình viên đi làm cũng làm từng mảnh rồi chạy thử.',
    },
    {
      wrong: 'Chương trình chạy ra đúng kết quả nghĩa là em đã làm đúng.',
      right: 'Đúng kết quả với một bộ dữ liệu chưa chắc đã đúng với bộ khác — như ví dụ hai khối `if` ở trên.',
      why: 'Vì vậy mỗi nhiệm vụ đều có nhiều test case, và có cả những yêu cầu về cấu trúc chứ không chỉ về kết quả.',
    },
  ],
};
