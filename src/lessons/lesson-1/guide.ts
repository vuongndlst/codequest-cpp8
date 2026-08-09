import type { ConceptGuide } from '@/types/content';

/**
 * Hướng dẫn kiến thức Khu vực 1.
 *
 * Câu hỏi cốt lõi không phải "cout viết thế nào" mà là "VÌ SAO máy tính lại
 * khó tính đến thế". Hiểu được lý do thì học sinh sẽ tự nhớ cú pháp, thay vì
 * học vẹt rồi quên sau một tuần.
 */
export const lesson1Guide: ConceptGuide = {
  lessonId: 'l1',
  bigQuestion:
    'Vì sao chỉ thiếu MỘT dấu chấm phẩy mà cả chương trình không chạy nổi? Máy tính không đoán được ý em à?',

  problem: {
    title: 'Máy tính không hiểu ý — nó chỉ đọc ký hiệu',
    body: 'Khi em nói với bạn "in ra Xin chào rồi in ra Tạm biệt", bạn hiểu ngay. Nhưng máy tính thì không có khả năng đoán ý. Nó chỉ đọc từng ký hiệu một, theo đúng thứ tự, và làm đúng những gì ký hiệu đó quy định. Nếu em viết câu lệnh mà không nói rõ chỗ nào là kết thúc, máy tính sẽ đọc dính hai câu vào nhau và không hiểu gì cả.',
    painfulExample: `// Nếu C++ cho phép viết tự do như tiếng Việt:

in ra Xin chao rồi in ra Tam biet

// Máy tính sẽ hỏi lại:
// "in" là lệnh hay là tên biến?
// "ra Xin chao rồi in ra Tam biet" là một dòng chữ hay ba lệnh riêng?
// Chỗ nào là hết câu?`,
    punchline:
      'Vấn đề không nằm ở việc máy tính ngốc. Vấn đề là ngôn ngữ tự nhiên có quá nhiều chỗ hiểu nhầm được.',
  },

  solution: {
    title: 'Cú pháp là bộ quy tắc để KHÔNG CÒN chỗ hiểu nhầm',
    body: 'Mỗi ký hiệu trong C++ có đúng một nhiệm vụ, không lẫn được với ký hiệu khác. Dấu nháy kép nói "phần này là chữ, cứ in nguyên văn". Dấu chấm phẩy nói "câu lệnh hết ở đây". Cặp ngoặc nhọn nói "những dòng này thuộc cùng một nhóm". Nhờ vậy máy tính đọc code không bao giờ hiểu sai — và quan trọng hơn, người khác đọc code của em cũng vậy.',
    cleanExample: `#include <iostream>      // xin phép dùng bộ công cụ nhập/xuất
using namespace std;     // gọi tắt cout thay vì std::cout

int main() {             // { mở nhóm: đây là phần thân của main
    cout << "Xin chao";  // ; nói rõ: câu lệnh hết ở đây
    cout << "Tam biet";  // nên đây là một câu lệnh KHÁC
    return 0;
}                        // } đóng nhóm`,
    whatChanged:
      'Không có ký hiệu nào là thừa. Mỗi cái đều đang trả lời một câu hỏi mà máy tính bắt buộc phải biết câu trả lời.',
  },

  mentalModel: {
    analogy: 'Máy tính giống một người làm theo công thức nấu ăn, tuyệt đối không tự suy diễn.',
    explanation:
      'Nếu công thức ghi "cho muối", người đó sẽ đứng im hỏi lại: bao nhiêu muối? Cho vào lúc nào? Máy tính cũng vậy. Dấu `;` giống dấu chấm cuối câu — không có nó thì hai bước bị đọc dính làm một. Cặp `{ }` giống cách đánh số các bước trong cùng một phần của công thức.',
  },

  thinkingSteps: [
    {
      question: 'Chương trình này cần in ra CHÍNH XÁC những dòng chữ nào?',
      why: 'Viết ra giấy trước sẽ giúp em biết cần bao nhiêu lệnh `cout`, thay vì gõ mò rồi sửa.',
    },
    {
      question: 'Có thông tin nào thay đổi được không, hay tất cả đều cố định?',
      why: 'Thông tin cố định thì viết thẳng trong dấu nháy kép. Thông tin thay đổi được thì phải cất vào một biến.',
    },
    {
      question: 'Mỗi dòng em vừa viết đã kết thúc bằng dấu `;` chưa?',
      why: 'Đây là lỗi số một của người mới. Kiểm tra bằng mắt trước khi bấm Chạy sẽ tiết kiệm cho em rất nhiều thời gian.',
    },
    {
      question: 'Số dấu `{` có bằng số dấu `}` không?',
      why: 'Đếm nhanh hai con số này là cách tự phát hiện lỗi nhanh nhất, không cần chạy chương trình.',
    },
  ],

  whenToUse: [
    'Dùng `cout` khi muốn cho người dùng thấy một thông tin',
    'Dùng biến khi một giá trị sẽ được dùng lại nhiều lần, hoặc có thể thay đổi',
    'Dùng `endl` khi muốn thông tin tiếp theo xuống dòng mới',
  ],

  whenNotToUse: [
    'Đừng tạo biến cho giá trị chỉ dùng đúng một lần và không bao giờ đổi — viết thẳng vào `cout` gọn hơn',
    'Đừng đặt dòng chữ cố định vào biến rồi mới in — thừa một bước không cần thiết',
  ],

  misconceptions: [
    {
      wrong: 'Máy tính hiểu được ý mình muốn gì, chỉ là nó khó tính thôi.',
      right: 'Máy tính hoàn toàn không biết em muốn gì. Nó chỉ làm đúng những ký hiệu em viết ra.',
      why: 'Hiểu điều này giúp em bớt bực khi gặp lỗi: máy không "cố tình làm khó", nó chỉ đang báo là em chưa nói rõ.',
    },
    {
      wrong: '`cout << score` sẽ in ra chữ "score".',
      right: '`cout << score` in ra GIÁ TRỊ đang nằm trong biến score. Muốn in chữ "score" thì phải có nháy kép.',
      why: 'Dấu nháy kép chính là ranh giới giữa "chữ để đọc" và "tên của một ô nhớ".',
    },
    {
      wrong: 'Thụt lề chỉ để cho đẹp, không thụt cũng chẳng sao.',
      right: 'Đúng là máy tính không quan tâm thụt lề. Nhưng NGƯỜI đọc code thì có — kể cả chính em ba tuần sau.',
      why: 'Code được đọc nhiều lần hơn số lần được viết. Viết cho người đọc mới là viết tốt.',
    },
  ],
};
