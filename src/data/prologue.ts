/**
 * PHẦN MỞ ĐẦU — "Thuật toán là gì?"
 *
 * Đặt TRƯỚC Area 0, không tính điểm, không khoá, không cấp chứng chỉ.
 *
 * Vì sao cần phần này:
 *   Học sinh lớp 8 thường nghĩ "học lập trình = học cú pháp C++". Hiểu vậy thì
 *   khi quên cú pháp là bế tắc hoàn toàn. Thực ra thứ khó là NGHĨ RA CÁC BƯỚC;
 *   cú pháp chỉ là cách viết các bước đó xuống cho máy tính đọc.
 *
 *   Phần này cũng là cầu nối tự nhiên vào Area 0: máy tính không tự suy diễn
 *   được, nên các bước phải rõ ràng tuyệt đối — và đó chính là lý do C++ khó
 *   tính với từng dấu chấm phẩy.
 *
 * Toàn bộ nội dung ở đây KHÔNG có một dòng C++ nào. Đó là chủ ý.
 */

export interface AlgorithmProperty {
  id: string;
  title: string;
  body: string;
  /** Ví dụ đạt yêu cầu */
  good: string;
  /** Ví dụ vi phạm — để học sinh thấy rõ ranh giới */
  bad: string;
}

export interface BuildingBlock {
  id: string;
  name: string;
  everydayExample: string;
  body: string;
  /** Khu vực nào của ByteLand dạy khối này */
  lessonId: string;
  zoneLabel: string;
  icon: string;
}

export interface OrderingActivity {
  id: string;
  prompt: string;
  /** Các bước, cố ý đưa ra theo thứ tự đã xáo trộn */
  steps: Array<{ id: string; text: string }>;
  /** Thứ tự đúng, theo id */
  correctOrder: string[];
  explanation: string;
}

export interface AmbiguityActivity {
  id: string;
  prompt: string;
  scenario: string;
  steps: Array<{ id: string; text: string; isAmbiguous: boolean; why: string }>;
}

export const PROLOGUE = {
  title: 'Thuật toán là gì?',
  subtitle: 'Phần mở đầu — đọc trước khi vào Làng Khởi Động',

  intro:
    'Trước khi viết dòng code C++ đầu tiên, mình cần thống nhất một chuyện. Thứ khó nhất khi lập trình KHÔNG phải là nhớ cú pháp. Thứ khó nhất là nghĩ ra được các bước cần làm. Nghĩ ra rồi thì viết bằng C++, Python hay tiếng Việt cũng chỉ là chuyện ghi chép.',

  /** Định nghĩa, cố ý viết bằng lời hằng ngày trước khi dùng thuật ngữ */
  definition: {
    plain:
      'Thuật toán là một dãy các bước rõ ràng, có thứ tự, làm theo đúng thì chắc chắn giải xong một việc.',
    formal:
      'Trong Tin học, thuật toán là dãy hữu hạn các thao tác được sắp xếp theo một trình tự xác định, nhằm giải quyết một bài toán từ dữ liệu đầu vào cho ra kết quả mong muốn.',
    bridge:
      'Hai câu trên nói cùng một điều. Câu dưới chỉ chặt chẽ hơn — và em sẽ cần sự chặt chẽ đó khi làm việc với máy tính.',
  },

  /**
   * Điểm chốt sư phạm: học sinh đã dùng thuật toán suốt đời rồi, chỉ là chưa
   * gọi tên nó. Bắt đầu từ chỗ quen thuộc rồi mới đi tới chỗ lạ.
   */
  everydayExamples: [
    {
      title: 'Pha một gói mì',
      steps: [
        'Đun sôi 400ml nước',
        'Bóc gói mì, cho vắt mì vào tô',
        'Đổ gói gia vị vào tô',
        'Chế nước sôi ngập vắt mì',
        'Đậy nắp, chờ đúng 3 phút',
        'Trộn đều rồi ăn',
      ],
    },
    {
      title: 'Đi từ nhà tới trường',
      steps: [
        'Ra khỏi nhà, rẽ trái',
        'Đi thẳng 200 mét tới ngã tư',
        'Nếu đèn đỏ thì dừng chờ, nếu đèn xanh thì đi tiếp',
        'Sang đường, rẽ phải',
        'Đi thẳng tới khi thấy cổng trường',
      ],
    },
  ],

  everydayPunchline:
    'Em đã dùng thuật toán mỗi ngày rồi, chỉ là chưa gọi tên nó thôi. Cái mới ở đây không phải "thuật toán", mà là việc phải viết nó ra thật rõ ràng cho một cái máy đọc.',

  /** Năm tính chất — mỗi cái kèm một ví dụ vi phạm để thấy rõ ranh giới */
  properties: [
    {
      id: 'input-output',
      title: 'Có đầu vào và đầu ra rõ ràng',
      body: 'Phải biết bắt đầu từ cái gì và kết thúc thì được cái gì. Không xác định được hai đầu này thì chưa phải bài toán.',
      good: 'Đầu vào: điểm ba môn Toán, Văn, Anh. Đầu ra: điểm trung bình.',
      bad: 'Đầu vào: một vài con số. Đầu ra: kết quả tốt.',
    },
    {
      id: 'ordered',
      title: 'Các bước có thứ tự',
      body: 'Đổi thứ tự là ra kết quả khác, hoặc hỏng hẳn. Thứ tự là một phần của thuật toán chứ không phải chuyện phụ.',
      good: 'Đun nước sôi trước, rồi mới chế vào tô mì.',
      bad: 'Chế nước vào tô mì, rồi mới đun nước sôi.',
    },
    {
      id: 'unambiguous',
      title: 'Mỗi bước phải rõ ràng, không hiểu hai nghĩa',
      body: 'Đây là tính chất khó nhất với người mới. Con người tự lấp chỗ trống bằng kinh nghiệm, còn máy tính thì không bao giờ.',
      good: 'Chờ đúng 3 phút.',
      bad: 'Chờ một lát cho mì mềm.',
    },
    {
      id: 'finite',
      title: 'Phải kết thúc sau hữu hạn bước',
      body: 'Thuật toán phải dừng lại được. Một dãy bước chạy mãi không dừng thì chưa giải quyết được gì cả.',
      good: 'Lặp lại 5 lần rồi dừng.',
      bad: 'Cứ lặp lại mãi cho tới khi thấy ổn.',
    },
    {
      id: 'effective',
      title: 'Mỗi bước phải làm được thật',
      body: 'Bước nào cũng phải nằm trong khả năng của người (hoặc máy) thực hiện nó.',
      good: 'Cộng hai số lại với nhau.',
      bad: 'Đoán xem bạn ấy đang nghĩ gì.',
    },
  ] satisfies AlgorithmProperty[],

  /** Vì sao máy tính khắt khe hơn con người — cầu nối sang Area 0 */
  whyComputersAreStrict: {
    title: 'Vì sao máy tính khó tính hơn con người rất nhiều',
    body: 'Khi em bảo bạn "lấy giúp mình quyển sách trên bàn", bạn tự hiểu là bàn nào, sách nào, lấy rồi đưa cho ai. Bạn lấp mọi chỗ trống bằng kinh nghiệm sống. Máy tính không có kinh nghiệm sống nào cả. Nó chỉ làm đúng những gì được ghi ra, không thêm không bớt. Vì vậy khi viết thuật toán cho máy, em phải ghi rõ tới mức không còn chỗ nào để hiểu nhầm.',
    bridge:
      'Đó là lý do C++ chú ý từng dấu chấm phẩy và từng cặp ngoặc. Những ký hiệu ấy đánh dấu ranh giới giữa các bước để máy không hiểu nhầm. Em sẽ kiểm chứng điều này ngay ở Area 0.',
  },

  /**
   * Ba khối xây dựng. Đây là ý lớn nhất của cả phần mở đầu: mọi thuật toán,
   * dù phức tạp tới đâu, cũng chỉ ghép từ ba kiểu bước này. Và ba kiểu đó
   * cho học sinh thấy lộ trình: phần đã mở trong Area 0–2 và phần sẽ học sau.
   */
  buildingBlocksIntro:
    'Đây là điều đáng ngạc nhiên nhất: mọi thuật toán trên đời, dù phức tạp tới đâu, cũng chỉ ghép lại từ BA kiểu bước. Không có kiểu thứ tư.',

  buildingBlocks: [
    {
      id: 'sequence',
      name: 'Tuần tự — làm lần lượt từng bước',
      everydayExample: 'Đun nước → cho mì vào tô → chế nước → chờ 3 phút',
      body: 'Kiểu đơn giản nhất: làm xong bước này thì sang bước kế tiếp, theo đúng thứ tự đã ghi. Phần lớn thuật toán là tuần tự.',
      lessonId: 'a0',
      zoneLabel: 'Area 0–1 · đang mở',
      icon: 'ArrowDown',
    },
    {
      id: 'repetition',
      name: 'Lặp lại — làm cùng một việc nhiều lần',
      everydayExample: 'Khuấy đều 20 vòng · Chép bài 3 lần · Đi 47 bước',
      body: 'Khi cùng một việc phải làm nhiều lần, em không liệt kê từng lần mà mô tả quy luật: làm việc này, lặp lại bấy nhiêu lần.',
      lessonId: 'a2',
      zoneLabel: 'Sẽ mở ở Area tiếp theo',
      icon: 'RefreshCw',
    },
    {
      id: 'selection',
      name: 'Rẽ nhánh — tuỳ tình huống mà làm khác đi',
      everydayExample: 'Nếu đèn đỏ thì dừng, nếu đèn xanh thì đi tiếp',
      body: 'Khi hành động phụ thuộc vào tình huống, thuật toán phải đặt câu hỏi rồi mới chọn đường. Đây là chỗ chương trình bắt đầu biết "suy nghĩ".',
      lessonId: 'a2',
      zoneLabel: 'Sẽ mở sau vertical slice',
      icon: 'GitBranch',
    },
  ] satisfies BuildingBlock[],

  buildingBlocksPunchline:
    'Trong phiên bản này, Area 0 giúp em làm quen C++ thật, Area 1 luyện trình tự điều khiển Byte và Area 2 luyện biến cùng dữ liệu. Vòng lặp và rẽ nhánh được báo trước nhưng chưa bắt em dùng khi nền móng chưa vững.',

  /** Hoạt động 1: sắp xếp các bước — luyện tính chất "có thứ tự" */
  orderingActivity: {
    id: 'order-sandwich',
    prompt:
      'Byte muốn pha một ly nước cam nhưng các bước bị xáo trộn hết. Em bấm vào các bước theo ĐÚNG THỨ TỰ giúp Byte nhé.',
    steps: [
      { id: 's-squeeze', text: 'Vắt cam lấy nước vào ly' },
      { id: 's-wash', text: 'Rửa sạch quả cam' },
      { id: 's-stir', text: 'Khuấy đều rồi thưởng thức' },
      { id: 's-cut', text: 'Bổ đôi quả cam' },
      { id: 's-sugar', text: 'Cho một thìa đường vào ly' },
    ],
    correctOrder: ['s-wash', 's-cut', 's-squeeze', 's-sugar', 's-stir'],
    explanation:
      'Thứ tự không phải chuyện tuỳ ý. Bổ cam trước khi rửa thì bụi bẩn dính vào ruột quả; khuấy trước khi cho đường thì chẳng để làm gì. Trong lập trình cũng vậy: đảo hai dòng lệnh có thể làm cả chương trình sai.',
  } satisfies OrderingActivity,

  /** Hoạt động 2: tìm bước mơ hồ — luyện tính chất khó nhất */
  ambiguityActivity: {
    id: 'spot-ambiguous',
    prompt:
      'Đây là hướng dẫn cho một con robot. Robot không có kinh nghiệm sống, nó chỉ làm đúng chữ. Em tìm xem bước nào robot KHÔNG hiểu nổi.',
    scenario: 'Nhiệm vụ của robot: tưới cây trong vườn trường.',
    steps: [
      {
        id: 'a1',
        text: 'Đi tới vòi nước ở góc sân',
        isAmbiguous: false,
        why: 'Bước này rõ: có đích đến cụ thể, robot làm được.',
      },
      {
        id: 'a2',
        text: 'Hứng đầy 2 lít nước vào bình',
        isAmbiguous: false,
        why: 'Bước này rõ: có con số cụ thể là 2 lít.',
      },
      {
        id: 'a3',
        text: 'Tưới cho cây một lượng nước vừa đủ',
        isAmbiguous: true,
        why: '"Vừa đủ" là bao nhiêu? Nửa lít hay hai lít? Người thì đoán được, robot thì đứng im. Muốn robot làm được, em phải ghi rõ: "tưới 0,5 lít cho mỗi cây".',
      },
      {
        id: 'a4',
        text: 'Lặp lại bước tưới cho cả 4 chậu cây',
        isAmbiguous: false,
        why: 'Bước này rõ: số lần lặp là 4, xác định được.',
      },
      {
        id: 'a5',
        text: 'Mang bình về chỗ cũ',
        isAmbiguous: false,
        why: 'Bước này rõ: "chỗ cũ" đã được nói ở bước 1 là vòi nước góc sân.',
      },
    ],
  } satisfies AmbiguityActivity,

  misconceptions: [
    {
      wrong: 'Học lập trình chủ yếu là học thuộc cú pháp của một ngôn ngữ.',
      right:
        'Phần khó là nghĩ ra các bước. Cú pháp chỉ là cách ghi các bước đó xuống, và luôn tra được trong Sổ tay lệnh.',
      why: 'Hiểu điều này giúp em không hoảng khi quên cú pháp — quên thì tra, còn không nghĩ ra các bước thì tra cũng vô ích.',
    },
    {
      wrong: 'Thuật toán là thứ gì đó cao siêu, chỉ dành cho người giỏi Toán.',
      right: 'Công thức nấu ăn, hướng dẫn lắp ráp, chỉ đường — tất cả đều là thuật toán.',
      why: 'Em đã quen với thuật toán từ lâu rồi. Việc cần học chỉ là viết chúng ra thật rõ ràng.',
    },
    {
      wrong: 'Một bài toán chỉ có đúng một thuật toán để giải.',
      right: 'Một bài toán thường có nhiều cách giải, chạy đúng như nhau nhưng dài ngắn khác nhau.',
      why: 'Vì vậy trong khoá này có những nhiệm vụ chạy đúng rồi vẫn được nhắc: "cách này đúng, nhưng thử cách gọn hơn xem".',
    },
    {
      wrong: 'Cứ viết code trước rồi vừa chạy vừa sửa cho tới khi đúng.',
      right: 'Nghĩ ra các bước trước, viết code sau. Sửa mò tốn thời gian hơn nhiều so với dừng lại nghĩ 2 phút.',
      why: 'Đó là lý do mỗi nhiệm vụ đều có bảng "Trước khi gõ code, em tự trả lời đã nhé".',
    },
  ],

  closing:
    'Từ giờ, mỗi khi gặp một nhiệm vụ mới, em hãy làm đúng thứ tự này: hiểu bài toán → nghĩ ra các bước → kiểm tra xem các bước đã rõ ràng chưa → rồi mới viết thành C++. Ba bước đầu không cần máy tính, chỉ cần một tờ giấy.',
} as const;
