import type { ConceptGuide } from '@/types/content';

/**
 * Hướng dẫn kiến thức Khu vực 3 — Vòng lặp for.
 *
 * Ý lớn cần truyền đạt: vòng lặp không phải mẹo viết tắt. Nó là cách MÔ TẢ
 * QUY LUẬT thay vì liệt kê từng trường hợp — và đó là bước nhảy tư duy thật sự.
 */
export const lesson3Guide: ConceptGuide = {
  lessonId: 'l3',
  bigQuestion:
    'Muốn làm một việc 100 lần, chẳng lẽ em phải chép 100 dòng code giống hệt nhau?',

  problem: {
    title: 'Chép tay không sai về logic, nhưng sai về mọi thứ khác',
    body: 'Con đường có 5 ô thì chép 5 dòng cũng xong. Nhưng thử nghĩ tiếp: nếu con đường có 50 ô? Nếu thầy đổi thành 47 ô? Em phải đếm lại từng dòng — mà đếm 47 dòng bằng mắt thì gần như chắc chắn sẽ lệch. Tệ hơn nữa: nếu mỗi bước cần thêm một việc (vừa đi vừa thắp đèn), em phải sửa CẢ 47 chỗ, sót một chỗ là chương trình chạy sai mà không hề báo lỗi.',
    painfulExample: `int main() {
    moveForward();
    moveForward();
    moveForward();
    moveForward();
    moveForward();
    // ... và 42 dòng nữa

    // Câu hỏi: ở trên có đúng 47 dòng không?
    // Em có dám chắc mà không đếm lại không?
    return 0;
}`,
    punchline:
      'Code chép tay giấu con số quan trọng nhất — số lần lặp — vào giữa một đống dòng giống hệt nhau. Không ai kiểm tra nổi.',
  },

  solution: {
    title: 'Mô tả QUY LUẬT, đừng liệt kê từng lần',
    body: 'Vòng lặp for cho em nói với máy tính bằng đúng cách em nói với một người: "đi tới trước 47 bước". Ba thông tin trong ngoặc trả lời ba câu hỏi: bắt đầu đếm từ đâu, đếm tới khi nào thì dừng, và mỗi lần đếm tăng bao nhiêu. Con số 47 giờ nằm ở đúng một chỗ, ai đọc cũng thấy ngay, và muốn đổi thì sửa đúng một ký tự.',
    cleanExample: `int main() {
    for (int i = 0; i < 47; i++) {
        moveForward();
    }
    return 0;
}

// Đọc thành lời:
// "Bắt đầu với i = 0.
//  Chừng nào i còn nhỏ hơn 47 thì còn làm tiếp.
//  Làm xong mỗi lần thì tăng i thêm 1."`,
    whatChanged:
      'Số lần lặp giờ hiện rõ thành một con số duy nhất. Muốn thêm việc cho mỗi bước, em sửa đúng một chỗ bên trong ngoặc nhọn.',
  },

  mentalModel: {
    analogy: 'Vòng lặp giống lời dặn "đi 5 bước", còn chép tay giống việc hô "bước, bước, bước, bước, bước".',
    explanation:
      'Biến đếm `i` chính là ngón tay em dùng để đếm. Nó bắt đầu ở một con số, mỗi vòng nhích lên một nấc, và em dừng lại khi nó chạm mốc. Nếu quên nhích ngón tay (quên `i++`), em sẽ đếm mãi ở số cũ và không bao giờ dừng được — đó chính là vòng lặp vô tận.',
  },

  thinkingSteps: [
    {
      question: 'Việc gì đang được lặp lại? Viết ra đúng MỘT lần thôi.',
      why: 'Nội dung viết một lần này chính là phần sẽ nằm trong ngoặc nhọn của vòng lặp.',
    },
    {
      question: 'Việc đó lặp bao nhiêu lần? Con số ấy từ đâu ra?',
      why: 'Con số này sẽ nằm trong phần điều kiện. Biết nó từ đâu ra giúp em tránh lỗi lệch một đơn vị.',
    },
    {
      question: 'Giữa các lần lặp, có gì THAY ĐỔI không?',
      why: 'Nếu mỗi lần in ra một số khác nhau thì em cần dùng biến đếm `i` bên trong thân vòng lặp. Nếu mọi lần y hệt nhau thì không cần đụng tới `i`.',
    },
    {
      question: 'Biến đếm bắt đầu từ 0 hay từ 1?',
      why: 'Bắt đầu từ 0 thì điều kiện là `i < N`. Bắt đầu từ 1 thì điều kiện là `i <= N`. Nhầm chỗ này là ra lỗi lệch một đơn vị.',
    },
    {
      question: 'Sau mỗi vòng, biến đếm có thật sự tiến gần tới điểm dừng không?',
      why: 'Nếu không, vòng lặp sẽ chạy mãi. Đây là cách tự kiểm tra trước khi bấm Chạy.',
    },
  ],

  whenToUse: [
    'Khi biết trước số lần cần lặp',
    'Khi thấy mình sắp chép cùng một dòng từ ba lần trở lên',
    'Khi cần đánh số thứ tự: bước 1, bước 2, bước 3…',
    'Khi cần làm cùng một việc với nhiều giá trị khác nhau theo quy luật',
  ],

  whenNotToUse: [
    'Đừng dùng vòng lặp khi chỉ làm đúng một lần — viết thẳng ra dễ đọc hơn',
    'Đừng dùng vòng lặp khi các lần làm hoàn toàn khác nhau, chẳng theo quy luật nào',
  ],

  misconceptions: [
    {
      wrong: '`for (int i = 0; i < 5; i++)` chạy 4 lần vì i dừng ở 4.',
      right: 'Nó chạy đúng 5 lần: i nhận các giá trị 0, 1, 2, 3, 4.',
      why: 'Đếm số lượng, đừng đếm giá trị cuối. Cách nhanh: từ 0 tới N−1 thì có đúng N số.',
    },
    {
      wrong: 'Biến đếm `i` phải được dùng bên trong thân vòng lặp.',
      right: 'Hoàn toàn không bắt buộc. `i` chỉ có nhiệm vụ đếm; nếu mỗi vòng làm việc y hệt nhau thì không cần đụng tới nó.',
      why: 'Hiểu điều này giúp em thoải mái dùng vòng lặp cho cả việc lặp đơn thuần.',
    },
    {
      wrong: 'Quên `i++` thì chương trình báo lỗi.',
      right: 'C++ không báo gì cả — chương trình vẫn hợp lệ, nó chỉ chạy mãi mãi.',
      why: 'Đây là lý do website tự dừng chương trình sau 2 giây và nhắc em kiểm tra biến đếm.',
    },
    {
      wrong: 'Vòng lặp làm chương trình chạy nhanh hơn chép tay.',
      right: 'Tốc độ chạy gần như y hệt. Cái được là code NGẮN HƠN, DỄ ĐỌC HƠN và DỄ SỬA HƠN.',
      why: 'Vòng lặp là công cụ cho con người, không phải mẹo tăng tốc cho máy.',
    },
  ],
};
