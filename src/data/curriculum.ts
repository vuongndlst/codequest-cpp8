export type ConceptCategory = 'cpp-language' | 'game-api';

export interface LearningConcept {
  id: string;
  category: ConceptCategory;
  name: string;
  englishName: string;
  explanation: string;
  syntax: string;
  example: string;
  commonMistakes: string[];
  introducedInLesson: string;
}

export type MicroPractice =
  | {
      id: string;
      type: 'single-choice';
      prompt: string;
      code?: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }
  | {
      id: string;
      type: 'ordering';
      prompt: string;
      items: string[];
      correctOrder: string[];
      explanation: string;
    }
  | {
      id: string;
      type: 'fill-code';
      prompt: string;
      code: string;
      acceptedAnswers: string[];
      explanation: string;
    };

export interface LessonLearningPath {
  lessonId: string;
  conceptIds: string[];
  predictionPrompt: string;
  practices: MicroPractice[];
}

/**
 * Kho kiến thức trung tâm: lesson, sổ tay và checkpoint có thể cùng tham chiếu
 * một khái niệm thay vì sao chép lời giải thích ở nhiều component.
 */
export const CONCEPTS: Record<string, LearningConcept> = {
  program: {
    id: 'program',
    category: 'cpp-language',
    name: 'Chương trình',
    englishName: 'program',
    explanation:
      'Một chương trình là danh sách chỉ dẫn đủ rõ để máy tính thực hiện theo đúng thứ tự.',
    syntax: 'int main() {\n    // các câu lệnh\n    return 0;\n}',
    example: 'int main() {\n    cout << "Xin chao!";\n    return 0;\n}',
    commonMistakes: ['Nghĩ rằng máy tự đoán bước còn thiếu', 'Bỏ qua thứ tự các câu lệnh'],
    introducedInLesson: 'l1',
  },
  statement: {
    id: 'statement',
    category: 'cpp-language',
    name: 'Câu lệnh',
    englishName: 'statement',
    explanation: 'Một câu lệnh mô tả một việc cụ thể. Phần lớn câu lệnh C++ kết thúc bằng dấu `;`.',
    syntax: 'cout << "Hello";',
    example: 'moveForward();',
    commonMistakes: ['Quên dấu `;`', 'Gộp nhiều việc vào một câu lệnh không hợp lệ'],
    introducedInLesson: 'l1',
  },
  sequence: {
    id: 'sequence',
    category: 'cpp-language',
    name: 'Trình tự',
    englishName: 'sequence',
    explanation: 'C++ chạy các câu lệnh từ trên xuống dưới; đổi thứ tự có thể làm đổi kết quả.',
    syntax: 'buocMot();\nbuocHai();\nbuocBa();',
    example: 'moveForward();\nturnRight();\nmoveForward();',
    commonMistakes: ['Đúng đủ lệnh nhưng sai thứ tự', 'Tưởng `turnRight()` cũng làm nhân vật tiến lên'],
    introducedInLesson: 'l1',
  },
  cout: {
    id: 'cout',
    category: 'cpp-language',
    name: 'Xuất dữ liệu với cout',
    englishName: 'standard output',
    explanation: '`cout` đưa thông tin từ chương trình ra màn hình kết quả.',
    syntax: 'cout << "Noi dung" << endl;',
    example: 'cout << "MO CONG" << endl;',
    commonMistakes: ['Quên `<<`', 'Quên dấu ngoặc kép hoặc dấu `;`'],
    introducedInLesson: 'l1',
  },
  'game-function-call': {
    id: 'game-function-call',
    category: 'game-api',
    name: 'Gọi hàm điều khiển Byte',
    englishName: 'game API function call',
    explanation:
      'ByteLand cung cấp sẵn các hàm điều khiển. Chúng dùng cú pháp C++ hợp lệ nhưng không phải hàm chuẩn của C++.',
    syntax: 'tenHam();',
    example: 'moveForward();',
    commonMistakes: ['Quên cặp `()`', 'Nhầm Game API với lệnh có sẵn trong mọi chương trình C++'],
    introducedInLesson: 'l1',
  },
  function: {
    id: 'function',
    category: 'cpp-language',
    name: 'Hàm',
    englishName: 'function',
    explanation: 'Hàm gom một công việc có tên để chương trình có thể gọi lại khi cần.',
    syntax: 'void tenHam() {\n    // công việc\n}',
    example: 'void showStatus() {\n    cout << "San sang" << endl;\n}',
    commonMistakes: ['Viết hàm nhưng quên gọi', 'Đặt tên hàm không thể hiện hành động'],
    introducedInLesson: 'l2',
  },
  parameter: {
    id: 'parameter',
    category: 'cpp-language',
    name: 'Tham số',
    englishName: 'parameter',
    explanation: 'Tham số là dữ liệu đầu vào giúp cùng một hàm xử lý nhiều giá trị khác nhau.',
    syntax: 'void showPower(int power) {\n    cout << power;\n}',
    example: 'showPower(30);\nshowPower(90);',
    commonMistakes: ['Quên kiểu dữ liệu của tham số', 'Dùng sai tên tham số trong thân hàm'],
    introducedInLesson: 'l2',
  },
};

export const LESSON_LEARNING_PATHS: Record<string, LessonLearningPath> = {
  l1: {
    lessonId: 'l1',
    conceptIds: ['program', 'statement', 'sequence', 'cout', 'game-function-call'],
    predictionPrompt:
      'Trước khi chạy, em luôn đọc từ dòng đầu xuống và dự đoán: Byte quay lúc nào, đi lúc nào, dừng ở ô nào?',
    practices: [
      {
        id: 'l1-practice-predict',
        type: 'single-choice',
        prompt: 'Byte đang quay sang phải. Đoạn code dưới đây làm Byte thay đổi vị trí mấy lần?',
        code: 'moveForward();\nturnRight();\nmoveForward();',
        options: ['1 lần', '2 lần', '3 lần', 'Không lần nào'],
        correctIndex: 1,
        explanation: '`turnRight()` chỉ đổi hướng. Hai lời gọi `moveForward()` mới làm Byte đổi ô.',
      },
      {
        id: 'l1-practice-order',
        type: 'ordering',
        prompt: 'Sắp xếp để Byte đi một ô, quay phải rồi đi tiếp một ô.',
        items: ['moveForward(); // bước thứ hai', 'turnRight();', 'moveForward(); // bước thứ nhất'],
        correctOrder: ['moveForward(); // bước thứ nhất', 'turnRight();', 'moveForward(); // bước thứ hai'],
        explanation: 'Thứ tự là một phần của thuật toán: đi → quay → đi.',
      },
      {
        id: 'l1-practice-semicolon',
        type: 'fill-code',
        prompt: 'Điền ký tự còn thiếu để câu lệnh C++ kết thúc đúng.',
        code: 'cout << "Byte san sang" << endl___',
        acceptedAnswers: [';'],
        explanation: 'Dấu `;` báo cho C++ biết câu lệnh đã kết thúc.',
      },
    ],
  },
  l2: {
    lessonId: 'l2',
    conceptIds: ['function', 'parameter', 'statement'],
    predictionPrompt:
      'Khi thấy tên một hàm trong `main()`, em thử tìm phần khai báo của hàm đó và lần theo những câu lệnh bên trong.',
    practices: [
      {
        id: 'l2-practice-call',
        type: 'single-choice',
        prompt: 'Điều gì xảy ra nếu một hàm đã được viết nhưng không được gọi trong `main()`?',
        options: ['Hàm tự chạy một lần', 'Hàm không chạy', 'C++ chạy hàm hai lần', 'Chương trình luôn bị treo'],
        correctIndex: 1,
        explanation: 'Khai báo hàm chỉ mô tả công việc; lời gọi hàm mới yêu cầu máy thực hiện công việc đó.',
      },
      {
        id: 'l2-practice-parameter',
        type: 'fill-code',
        prompt: 'Điền kiểu dữ liệu còn thiếu của tham số `power`.',
        code: 'void showPower(___ power) {\n    cout << power;\n}',
        acceptedAnswers: ['int'],
        explanation: 'Mỗi tham số C++ cần có kiểu dữ liệu. Ở đây `power` là số nguyên nên dùng `int`.',
      },
    ],
  },
};

export function getLearningPath(lessonId: string): LessonLearningPath | undefined {
  return LESSON_LEARNING_PATHS[lessonId];
}

export function getConcept(conceptId: string): LearningConcept | undefined {
  return CONCEPTS[conceptId];
}
