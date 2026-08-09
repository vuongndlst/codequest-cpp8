import type { ConceptGuide } from '@/types/content';

/**
 * Hướng dẫn kiến thức Khu vực 2 — Hàm.
 *
 * Điểm mấu chốt: học sinh phải CẢM THẤY cái khổ của một hàm main dài dòng
 * trước, thì mới thấy hàm là món quà chứ không phải thêm việc.
 */
export const lesson2Guide: ConceptGuide = {
  lessonId: 'l2',
  bigQuestion:
    'Viết thẳng tất cả vào main thì cũng chạy đúng mà? Vậy tách ra thành hàm để làm gì cho mệt?',

  problem: {
    title: 'Một khối code dài là một khối code không ai dám sửa',
    body: 'Chương trình dưới đây chạy hoàn toàn đúng. Nhưng thử tưởng tượng: thầy bảo em đổi lời chào. Em phải đọc từ đầu tới cuối để tìm xem dòng nào là lời chào. Rồi thầy bảo in lời chào thêm một lần nữa ở cuối — em phải chép lại cả hai dòng. Chép xong, nếu sau này cần sửa thì phải nhớ sửa ở CẢ HAI chỗ, quên một chỗ là sai.',
    painfulExample: `int main() {
    cout << "Chao mung den ByteLand" << endl;
    cout << "Chuc em hoc vui" << endl;
    cout << "Dang kiem tra he thong..." << endl;
    cout << "He thong: on dinh" << endl;
    cout << "Nang luong: 100" << endl;
    cout << "Chao mung den ByteLand" << endl;   // chép lại lần 2
    cout << "Chuc em hoc vui" << endl;          // chép lại lần 2
    return 0;
}`,
    punchline:
      'Đoạn code này có hai vấn đề: đọc vào không biết đâu là việc gì, và cùng một nội dung nằm ở hai nơi khác nhau.',
  },

  solution: {
    title: 'Đặt TÊN cho từng nhóm việc',
    body: 'Hàm không thêm khả năng gì mới cho chương trình — nó chỉ cho em đặt tên cho một nhóm câu lệnh. Nhưng chỉ riêng việc đặt tên thôi đã thay đổi mọi thứ: người đọc nhìn `printWelcome()` là hiểu ngay đoạn đó làm gì, không cần đọc chi tiết. Và khi cần lời chào lần thứ hai, em gọi lại một dòng thay vì chép hai dòng. Muốn sửa lời chào, em chỉ sửa ở đúng MỘT chỗ.',
    cleanExample: `void printWelcome() {
    cout << "Chao mung den ByteLand" << endl;
    cout << "Chuc em hoc vui" << endl;
}

void printSystemStatus() {
    cout << "Dang kiem tra he thong..." << endl;
    cout << "He thong: on dinh" << endl;
    cout << "Nang luong: 100" << endl;
}

int main() {
    printWelcome();
    printSystemStatus();
    printWelcome();          // dùng lại, không chép lại
    return 0;
}`,
    whatChanged:
      'Đọc riêng hàm main giờ đã hiểu cả chương trình làm gì. Muốn biết chi tiết mới cần đọc xuống dưới. Và mỗi nội dung chỉ tồn tại ở đúng một nơi.',
  },

  mentalModel: {
    analogy: 'Hàm giống một nút bấm trên chiếc điều khiển từ xa.',
    explanation:
      'Bên trong nút "Tăng âm lượng" có cả một mạch điện phức tạp, nhưng em không cần biết. Em chỉ cần bấm. Viết hàm là lắp cái nút đó; gọi hàm là bấm nó. Và cũng như cái điều khiển: nút được lắp rồi mà không ai bấm thì chẳng có gì xảy ra cả.',
  },

  thinkingSteps: [
    {
      question: 'Chương trình này gồm những NHÓM VIỆC nào? Thử đặt tên từng nhóm bằng tiếng Việt.',
      why: 'Nếu em gọi tên được nhóm việc bằng một cụm từ ngắn, thì đó chính là một hàm. Nếu phải giải thích dài dòng, có lẽ nhóm đó nên chia nhỏ tiếp.',
    },
    {
      question: 'Có nhóm việc nào bị lặp lại ở hai chỗ trở lên không?',
      why: 'Code lặp lại là dấu hiệu rõ ràng nhất cho thấy chỗ đó nên thành một hàm.',
    },
    {
      question: 'Các lần làm việc này có gì KHÁC nhau không?',
      why: 'Nếu hoàn toàn giống nhau thì hàm không cần tham số. Nếu chỉ khác một con số hay một dòng chữ, thì chỗ khác nhau đó chính là tham số.',
    },
    {
      question: 'Tên hàm em vừa đặt có nói rõ nó LÀM GÌ không?',
      why: 'Tên tốt bắt đầu bằng một động từ: openDoor, printScore, checkEnergy. Tên như `data` hay `thing1` không giúp được ai.',
    },
    {
      question: 'Mỗi hàm em viết ra đã được gọi ở đâu chưa?',
      why: 'Đây là lỗi phổ biến nhất của khu vực này. Hàm viết xong mà không gọi thì hoàn toàn không chạy.',
    },
  ],

  whenToUse: [
    'Khi một nhóm câu lệnh làm chung một việc và em gọi tên được việc đó',
    'Khi cùng một đoạn code xuất hiện từ hai lần trở lên',
    'Khi hàm main dài tới mức phải cuộn màn hình mới đọc hết',
    'Khi muốn người khác đọc chương trình mà không cần đọc chi tiết',
  ],

  whenNotToUse: [
    'Đừng tạo hàm chỉ chứa đúng một dòng `cout` và chỉ được gọi một lần — như vậy còn khó đọc hơn',
    'Đừng tách hàm khi các câu lệnh chẳng liên quan gì tới nhau, chỉ vì thấy main hơi dài',
  ],

  misconceptions: [
    {
      wrong: 'Viết hàm xong là hàm sẽ tự chạy.',
      right: 'Viết hàm chỉ là DẠY máy tính cách làm. Máy chỉ thực sự làm khi em GỌI hàm trong main.',
      why: 'Đây là hiểu lầm số một của khu vực này. Nhớ hình ảnh cái điều khiển: lắp nút xong vẫn phải bấm.',
    },
    {
      wrong: 'Hàm phải viết bên trong main thì mới dùng được trong main.',
      right: 'Hàm phải viết BÊN NGOÀI main, thường là ở phía trên main.',
      why: 'main cũng chỉ là một hàm. Đặt hàm này trong hàm kia là lồng nhau — C++ trong khoá này không cho phép.',
    },
    {
      wrong: 'Tách hàm làm chương trình chạy chậm hơn vì phải nhảy qua nhảy lại.',
      right: 'Với các bài ở mức này, khác biệt tốc độ nhỏ tới mức không đo được.',
      why: 'Thời gian của người đọc code quý hơn vài phần triệu giây của máy tính rất nhiều.',
    },
    {
      wrong: 'Tham số và biến bình thường là một.',
      right: 'Tham số là ô trống của hàm, được điền giá trị mới mỗi lần gọi.',
      why: 'Nhờ vậy MỘT hàm phục vụ được nhiều tình huống, thay vì phải viết ba hàm gần giống nhau.',
    },
  ],
};
