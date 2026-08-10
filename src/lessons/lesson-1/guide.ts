import type { ConceptGuide } from '@/types/content';

/**
 * Hướng dẫn kiến thức Khu vực 1 — Ra lệnh & Thuật toán.
 *
 * Khu vực này KHÔNG dạy cú pháp trước. Nó dạy điều đến trước cú pháp: muốn máy
 * làm được việc, em phải tự chia việc đó thành các bước, và phải chia đúng thứ
 * tự. Cú pháp chỉ là cách viết các bước ấy ra giấy.
 *
 * Đó cũng là lý do `cout` không xuất hiện ở đây. Lệnh đầu tiên học sinh gõ là
 * một lệnh khiến NHÂN VẬT ĐỘNG ĐẬY — vì bước đi thì nhìn thấy được, còn một
 * dòng chữ in ra màn hình thì chưa nói lên điều gì với em mới bắt đầu.
 */
export const lesson1Guide: ConceptGuide = {
  lessonId: 'l1',
  bigQuestion:
    'Vì sao nói với bạn một câu là bạn hiểu ngay, còn nói với máy tính thì phải tách ra từng bước nhỏ một?',

  problem: {
    title: 'Máy tính không biết "đi tới chỗ viên ngọc" nghĩa là gì',
    body: 'Em nhờ bạn: "lấy giúp mình viên ngọc kia". Bạn tự biết phải đứng dậy, đi vòng qua cái bàn, cúi xuống, nhặt lên. Bạn lấp đầy hàng chục bước mà em không cần nói. Máy tính thì không lấp được bước nào cả. Nó chỉ làm đúng những gì em liệt kê, theo đúng thứ tự em liệt kê, không thêm không bớt.',
    painfulExample: `// Nếu ra lệnh cho máy tính như nói với bạn:

đi tới chỗ viên ngọc rồi nhặt nó lên

// Máy tính đứng im và hỏi lại:
// "Đi" là đi mấy ô? Đi về hướng nào?
// Trước mặt có bụi gai thì làm gì?
// "Tới chỗ" là tới sát bên hay đứng đè lên?`,
    punchline:
      'Máy tính không ngốc. Nó chỉ tuyệt đối không tự suy diễn — và đó chính là lý do em phải học cách chia nhỏ công việc.',
  },

  solution: {
    title: 'Thuật toán là danh sách các bước, đủ nhỏ để máy làm được',
    body: 'Chia "đi tới viên ngọc" thành từng bước mà máy hiểu được: tiến một ô, tiến một ô nữa, quay phải, tiến một ô, nhặt. Mỗi dòng là một bước. Máy chạy từ trên xuống dưới, không nhảy cóc, không đảo thứ tự. Danh sách các bước ấy chính là một thuật toán — và viết nó ra bằng C++ thì gọi là chương trình.',
    cleanExample: `int main() {
    moveForward();   // bước 1: tiến một ô
    moveForward();   // bước 2: tiến một ô nữa
    turnRight();     // bước 3: quay phải, đứng yên tại chỗ
    moveForward();   // bước 4: giờ mới đi xuống được
    collectGem();    // bước 5: nhặt ngọc
    return 0;
}`,
    whatChanged:
      'Từ một câu nói mơ hồ thành năm bước rõ ràng, ai đọc cũng hiểu và máy nào chạy cũng ra cùng kết quả.',
  },

  mentalModel: {
    analogy: 'Máy tính giống một người bạn bị bịt mắt, chỉ làm theo lời em hô.',
    explanation:
      'Bạn ấy rất khoẻ và không bao giờ mệt, nhưng không nhìn thấy gì cả. Em hô "tiến một bước" thì bạn tiến đúng một bước — kể cả khi trước mặt là bức tường. Bạn không tự tránh, cũng không hỏi lại. Nên trước khi hô, em phải tự hình dung trong đầu cả quãng đường: đi mấy bước, quay ở đâu, quay về hướng nào.',
  },

  thinkingSteps: [
    {
      question: 'Đích đến nằm ở đâu, và nhân vật đang đứng ở đâu?',
      why: 'Không biết điểm đầu và điểm cuối thì không thể đếm được cần đi bao nhiêu bước. Nhìn bản đồ trước khi gõ luôn nhanh hơn gõ mò rồi sửa.',
    },
    {
      question: 'Nhân vật đang quay mặt về hướng nào?',
      why: 'Lệnh tiến luôn đi theo hướng đang quay, chứ không phải hướng em muốn. Đây là hiểu lầm khiến học sinh mất thời gian nhiều nhất ở khu vực này.',
    },
    {
      question: 'Trên đường có chỗ nào không đi qua được không?',
      why: 'Gặp vật cản thì phải quay hướng khác để đi vòng. Phát hiện sớm sẽ tránh được việc viết xong cả chương trình mới thấy nhân vật đâm vào bụi cây.',
    },
    {
      question: 'Em đọc lại danh sách bước của mình, có bước nào thiếu hoặc thừa không?',
      why: 'Tự chạy chương trình trong đầu trước khi bấm Chạy là kỹ năng quan trọng nhất của người lập trình. Nó giúp em tìm ra lỗi mà chưa cần máy tính.',
    },
    {
      question: 'Có cách nào đi tới đích bằng ít bước hơn không?',
      why: 'Cùng một đích đến thường có nhiều đường đi. Chọn được đường ngắn hơn nghĩa là em đã bắt đầu so sánh các thuật toán với nhau, chứ không chỉ làm cho xong.',
    },
  ],

  whenToUse: [
    'Dùng `moveForward()` khi muốn nhân vật tiến đúng một ô theo hướng đang quay',
    'Dùng `turnRight()` hoặc `turnLeft()` khi cần đổi hướng trước lúc đi tiếp',
    'Dùng `collectGem()` khi nhân vật đã đứng đúng ô có viên ngọc',
    'Dùng `cout` khi muốn nhân vật nói ra một câu để tác động tới thế giới',
  ],

  whenNotToUse: [
    'Đừng gọi `turnRight()` khi nhân vật đã quay đúng hướng rồi — thừa một bước và dễ làm em rối',
    'Đừng gọi `collectGem()` khi chưa đi tới ô có ngọc; đứng từ xa thì không với tới được',
    'Đừng viết thêm lệnh tiến "cho chắc" — đi quá đích cũng là chưa hoàn thành nhiệm vụ',
  ],

  misconceptions: [
    {
      wrong: 'Lệnh `turnRight()` vừa quay vừa làm nhân vật tiến lên một ô.',
      right: 'Quay chỉ đổi hướng nhìn, nhân vật vẫn đứng nguyên tại ô cũ.',
      why: 'Tách rời "quay" và "đi" giúp em kiểm soát chính xác từng bước. Nếu quay mà tự đi thì em không bao giờ đứng lại được đúng ô mình muốn.',
    },
    {
      wrong: 'Viết `moveForward()` là nhân vật đi thẳng tới đích luôn.',
      right: 'Mỗi lần gọi chỉ tiến đúng MỘT ô. Muốn đi ba ô thì phải gọi ba lần.',
      why: 'Máy tính làm đúng một việc cho một lệnh. Hiểu điều này là hiểu vì sao chương trình dài ra rất nhanh — và cũng là lý do sau này em cần tới vòng lặp.',
    },
    {
      wrong: 'Thứ tự các dòng không quan trọng, miễn là có đủ lệnh.',
      right: 'Máy chạy từ trên xuống dưới. Đổi thứ tự hai dòng là ra kết quả khác hẳn.',
      why: 'Quay trước rồi đi sẽ tới một ô, đi trước rồi quay sẽ tới ô khác. Thứ tự chính là phần cốt lõi của một thuật toán.',
    },
    {
      wrong: 'Nhân vật tự tránh vật cản nếu trước mặt có bụi gai.',
      right: 'Nhân vật đâm thẳng vào và đứng lại. Em phải tự cho nó quay sang hướng khác.',
      why: 'Máy tính không tự suy diễn. Mọi tình huống em không lường trước đều trở thành một lỗi khi chạy.',
    },
  ],
};
