import type { ConceptGuide } from '@/types/content';

/**
 * Hướng dẫn kiến thức Khu vực 4 — Câu lệnh if.
 *
 * Ý lớn: cho tới giờ chương trình của học sinh luôn chạy thẳng một mạch, làm
 * đúng những việc đã định sẵn. `if` là lần đầu tiên chương trình biết NHÌN vào
 * tình huống thực tế rồi mới quyết định — đó là bước nhảy về tư duy, không chỉ
 * là thêm một cú pháp mới.
 */
export const lesson4Guide: ConceptGuide = {
  lessonId: 'l4',
  bigQuestion:
    'Chương trình của em từ trước tới giờ luôn làm y hệt nhau mỗi lần chạy. Làm sao để nó biết tuỳ tình huống mà xử lý khác đi?',

  problem: {
    title: 'Chương trình mù thì gặp gì cũng đâm đầu vào',
    body: 'Với hàm và vòng lặp, em đã điều khiển được nhân vật đi và làm việc. Nhưng mọi lệnh đều được quyết định TRƯỚC khi chạy. Nếu cánh cửa phía trước bị khoá, nhân vật vẫn cứ lao vào. Nếu năng lượng đã cạn, nhân vật vẫn cố bước và ngã. Chương trình không hề biết chuyện gì đang xảy ra quanh nó.',
    painfulExample: `int main() {
    // Nhân vật cứ mở cửa, bất kể có chìa khoá hay không
    openDoor();
    moveForward();

    // Nếu không có chìa, cửa vẫn khoá
    // -> nhân vật đâm vào cửa và đứng im
    // -> chương trình KHÔNG báo lỗi gì cả
    // -> em chỉ biết là sai khi nhìn màn hình
    return 0;
}`,
    punchline:
      'Chương trình chạy xong mà kết quả sai, lại không có thông báo lỗi nào — đó là loại lỗi khó tìm nhất.',
  },

  solution: {
    title: 'Hỏi trước, làm sau',
    body: 'Câu lệnh `if` cho chương trình đặt một câu hỏi rồi mới hành động. Câu hỏi ấy được viết bằng toán tử so sánh, và câu trả lời chỉ có thể là đúng hoặc sai — không có "có lẽ". Nếu đúng, phần trong ngoặc nhọn chạy. Nếu sai, máy tính bỏ qua toàn bộ khối đó và đi tiếp, không báo lỗi, không dừng lại.',
    cleanExample: `int main() {
    // Hỏi trước: mình có chìa khoá không?
    if (hasKey()) {
        openDoor();      // chỉ mở cửa khi CÓ chìa
    }

    // Hỏi trước: còn năng lượng không?
    if (getEnergy() > 0) {
        moveForward();   // chỉ đi khi CÒN sức
    }

    return 0;
}`,
    whatChanged:
      'Mỗi hành động giờ đều có một điều kiện canh giữ phía trước. Chương trình đọc vào cũng dễ hiểu hơn: nó nói rõ vì sao lại làm việc đó.',
  },

  mentalModel: {
    analogy: '`if` giống việc nhìn trước khi sang đường.',
    explanation:
      'Em không băng qua đường rồi mới nhìn — em nhìn trước, thấy an toàn thì mới bước. Điều kiện trong ngoặc tròn chính là cái nhìn đó. Và nhớ: một dấu `=` là ĐẶT giá trị vào biến (như tự tay đổi đèn giao thông thành xanh), còn hai dấu `==` mới là HỎI xem đèn có đang xanh không.',
  },

  thinkingSteps: [
    {
      question: 'Hành động này có phải lúc nào cũng nên làm không, hay chỉ trong một số trường hợp?',
      why: 'Nếu câu trả lời là "chỉ trong một số trường hợp" thì chỗ đó cần một câu `if`.',
    },
    {
      question: 'Điều kiện của em phát biểu thành lời tiếng Việt là gì?',
      why: 'Đọc thành lời — "nếu năng lượng lớn hơn 0 thì đi tiếp" — giúp em phát hiện ngay điều kiện viết ngược hoặc thiếu.',
    },
    {
      question: 'Trong sáu toán tử so sánh, cái nào khớp với câu vừa phát biểu?',
      why: '"lớn hơn" là `>`, "từ … trở lên" là `>=`, "bằng đúng" là `==`. Chọn nhầm `>` với `>=` là lỗi lệch ranh giới rất hay gặp.',
    },
    {
      question: 'Em đang HỎI hay đang GÁN?',
      why: 'Trong ngoặc của `if` hầu như luôn là HỎI, nên hầu như luôn dùng `==` chứ không phải `=`. Đây là lỗi duy nhất mà C++ không hề báo.',
    },
    {
      question: 'Nếu điều kiện sai thì chuyện gì xảy ra?',
      why: 'Với `if` đơn, câu trả lời là "không làm gì cả, chương trình đi tiếp". Nghĩ trước điều này giúp em biết mình có cần thêm nhánh xử lý hay không.',
    },
  ],

  whenToUse: [
    'Khi một hành động chỉ nên xảy ra trong một số tình huống nhất định',
    'Khi cần kiểm tra điều kiện an toàn trước khi làm gì đó: còn năng lượng, có chìa khoá, đủ điểm',
    'Khi muốn chương trình phản ứng theo dữ liệu thay vì chạy cố định',
  ],

  whenNotToUse: [
    'Đừng viết `if` cho điều kiện chắc chắn luôn đúng — thừa và làm code khó đọc',
    'Đừng dùng nhiều `if` rời để xử lý các trường hợp loại trừ nhau; đó là việc của `if–else` ở Khu vực 5',
  ],

  misconceptions: [
    {
      wrong: '`if (score = 10)` kiểm tra xem score có bằng 10 không.',
      right: '`score = 10` GÁN số 10 cho score, rồi trả về 10 — mà 10 khác 0 nên điều kiện LUÔN đúng.',
      why: 'C++ coi đây là code hợp lệ nên không báo lỗi gì. Website chặn lại giúp em, nhưng compiler thật thì không.',
    },
    {
      wrong: 'Nếu điều kiện sai thì chương trình dừng lại hoặc báo lỗi.',
      right: 'Máy tính chỉ lặng lẽ bỏ qua khối `if` rồi chạy tiếp dòng phía dưới.',
      why: 'Hiểu điều này giúp em không hoang mang khi chương trình chạy xong mà chẳng in ra gì.',
    },
    {
      wrong: 'Có `if` thì bắt buộc phải có `else`.',
      right: '`if` đứng một mình hoàn toàn hợp lệ, dùng khi "nếu đúng thì làm, còn sai thì thôi".',
      why: 'Thêm `else` rỗng chỉ làm code dài ra mà không nói thêm được điều gì.',
    },
    {
      wrong: 'Đặt dấu `;` sau `if (...)` cũng không sao, vì dòng nào cũng cần dấu `;`.',
      right: '`if (dieuKien);` biến thân của `if` thành rỗng — khối `{ }` phía dưới trở thành khối độc lập và LUÔN chạy.',
      why: 'Lỗi này rất khó nhìn ra bằng mắt vì code trông vẫn rất bình thường.',
    },
  ],
};
