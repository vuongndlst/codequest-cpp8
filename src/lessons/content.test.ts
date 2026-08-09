import { describe, expect, it } from 'vitest';
import { LESSONS, getChallenge } from './index';
import { analyzeChallenge } from '@/validators';
import { tokenize } from '@/validators/lexer';
import { parse } from '@/validators/parser';

/**
 * Kiểm định NỘI DUNG bài học.
 *
 * Đây là lưới an toàn quan trọng nhất khi soạn ~45 challenge: nó bắt được
 * những sai sót của người soạn bài TRƯỚC KHI học sinh gặp phải trên lớp —
 * ví dụ đáp án mẫu không chạy được, hay expectedOutput gõ nhầm một dấu cách.
 */

/**
 * Mẫu bị cấm là thứ hỏng ÂM THẦM: nếu biểu thức DSL viết sai, hệ thống vẫn
 * chạy bình thường và vẫn cho học sinh qua bài bằng cách làm tắt — không có
 * dấu hiệu nào báo lỗi. Vì vậy mỗi mẫu cấm đều phải có test chứng minh nó
 * thực sự chặn được cách làm tắt tương ứng.
 */
describe('Mẫu bị cấm thực sự chặn được cách làm tắt', () => {
  it('l3-c4: gọi tay moveForward 5 lần bị chặn, dù kết quả tới đích', () => {
    const challenge = getChallenge('l3', 'l3-c4-mission')!;
    const bruteForce = `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    moveForward();
    moveForward();
    moveForward();
    return 0;
}`;

    const result = analyzeChallenge(bruteForce, challenge);

    expect(result.ok).toBe(true); // chương trình chạy được
    expect(result.isCorrect).toBe(false); // nhưng chưa đạt yêu cầu nhiệm vụ

    const diagnostic = result.diagnostics.find((d) => d.code === 'PATTERN_FORBIDDEN');
    expect(diagnostic).toBeDefined();
    // Giọng văn phải khuyến khích, tuyệt đối không chê bai
    expect(diagnostic!.message).toContain('vòng lặp');
    expect(diagnostic!.message).not.toMatch(/sai|thất bại|kém/i);
  });

  it('l3-c9: gọi tay takeOneStep 8 lần bị chặn', () => {
    const challenge = getChallenge('l3', 'l3-c9-boss')!;
    const calls = Array.from({ length: 8 }, () => '    takeOneStep();').join('\n');
    const bruteForce = `#include <iostream>
using namespace std;

void takeOneStep() {
    moveForward();
}

int main() {
${calls}
    return 0;
}`;

    const result = analyzeChallenge(bruteForce, challenge);
    expect(result.isCorrect).toBe(false);
    expect(result.errorCodes).toContain('PATTERN_FORBIDDEN');
  });

  it('l5-c9: gọi tay attackOrCelebrate 4 lần bị chặn ở trận cuối', () => {
    const challenge = getChallenge('l5', 'l5-c9-boss')!;
    const bruteForce = `#include <iostream>
using namespace std;

void attackOrCelebrate() {
    if (getBugHp() > 0) {
        attackBug();
    } else {
        cout << "Bug King da bi danh bai!" << endl;
    }
}

int main() {
    attackOrCelebrate();
    attackOrCelebrate();
    attackOrCelebrate();
    attackOrCelebrate();
    return 0;
}`;

    const result = analyzeChallenge(bruteForce, challenge);
    expect(result.isCorrect).toBe(false);
    expect(result.errorCodes).toContain('PATTERN_FORBIDDEN');
  });
});

/** Nhiệm vụ dạy if–else phải từ chối cách viết hai khối if rời nhau. */
describe('Yêu cầu cấu trúc bắt buộc được thực thi đúng', () => {
  it('l5-c6: hai khối if rời không được tính là if–else', () => {
    const challenge = getChallenge('l5', 'l5-c6-debug')!;
    const twoSeparateIfs = `#include <iostream>
using namespace std;

int main() {
    int magicPower = 20;

    if (magicPower >= 50) {
        cout << "Phep thuat manh" << endl;
    }

    if (magicPower < 50) {
        cout << "Phep thuat yeu" << endl;
    }

    return 0;
}`;

    const result = analyzeChallenge(twoSeparateIfs, challenge);

    // Kết quả in ra ĐÚNG, nhưng cấu trúc chưa đạt yêu cầu bài học
    expect(result.stdout).toEqual(['Phep thuat yeu']);
    expect(result.isCorrect).toBe(false);
    expect(result.errorCodes).toContain('PATTERN_MISSING');
  });

  it('l3-c4: dùng đúng vòng lặp thì được công nhận', () => {
    const challenge = getChallenge('l3', 'l3-c4-mission')!;
    const result = analyzeChallenge(challenge.solution!, challenge);

    expect(result.isCorrect).toBe(true);
    expect(result.errorCodes).toHaveLength(0);
  });
});

describe.each(LESSONS.map((lesson) => [lesson.id, lesson] as const))(
  'Nội dung bài %s',
  (_lessonId, lesson) => {
    it('có đủ số lượng node theo yêu cầu mục 25 của đề bài', () => {
      const kinds = lesson.challenges.map((challenge) => challenge.kind);

      expect(kinds.filter((kind) => kind === 'debug')).toHaveLength(2);
      expect(kinds.filter((kind) => kind === 'cleancode')).toHaveLength(1);
      expect(kinds.filter((kind) => kind === 'boss')).toHaveLength(1);
      // 3–5 hoạt động nhỏ: story + concept + sandbox + mission
      const activities = kinds.filter((kind) =>
        ['story', 'concept', 'sandbox', 'mission'].includes(kind),
      );
      expect(activities.length).toBeGreaterThanOrEqual(3);
      expect(activities.length).toBeLessThanOrEqual(5);
    });

    it('có hướng dẫn tư duy đầy đủ, không chỉ dạy cú pháp', () => {
      const guide = lesson.conceptGuide;

      expect(guide.lessonId).toBe(lesson.id);
      // Câu hỏi lớn phải là câu hỏi thật, kết thúc bằng dấu hỏi
      expect(guide.bigQuestion).toContain('?');
      expect(guide.bigQuestion.length).toBeGreaterThan(30);

      // Phải NÊU VẤN ĐỀ trước khi giới thiệu lệnh mới
      expect(guide.problem.painfulExample.length).toBeGreaterThan(40);
      expect(guide.problem.punchline.length).toBeGreaterThan(20);

      // Phải cho thấy lệnh mới thay đổi được điều gì
      expect(guide.solution.cleanExample.length).toBeGreaterThan(40);
      expect(guide.solution.whatChanged.length).toBeGreaterThan(20);

      // Mô hình tư duy để nhớ lâu
      expect(guide.mentalModel.analogy.length).toBeGreaterThan(20);
      expect(guide.mentalModel.explanation.length).toBeGreaterThan(40);
    });

    it('có ít nhất 4 bước tư duy, mỗi bước đều giải thích VÌ SAO phải hỏi', () => {
      const steps = lesson.conceptGuide.thinkingSteps;
      expect(steps.length).toBeGreaterThanOrEqual(4);

      for (const step of steps) {
        expect(step.question).toContain('?');
        expect(step.why.length).toBeGreaterThan(25);
      }
    });

    it('có hướng dẫn dùng / chưa cần dùng và ít nhất 3 hiểu lầm thường gặp', () => {
      const guide = lesson.conceptGuide;
      expect(guide.whenToUse.length).toBeGreaterThanOrEqual(3);
      expect(guide.whenNotToUse.length).toBeGreaterThanOrEqual(2);
      expect(guide.misconceptions.length).toBeGreaterThanOrEqual(3);

      for (const item of guide.misconceptions) {
        expect(item.wrong.length).toBeGreaterThan(15);
        expect(item.right.length).toBeGreaterThan(15);
        expect(item.why.length).toBeGreaterThan(20);
      }
    });

    it('Boss Challenge có câu hỏi tư duy riêng và nói rõ rèn kỹ năng gì', () => {
      const boss = lesson.challenges.find((challenge) => challenge.kind === 'boss')!;
      expect(boss.thinkingPrompt).toBeDefined();
      expect(boss.thinkingPrompt!.length).toBeGreaterThan(40);
      expect(boss.whyThisMatters).toBeDefined();
      expect(boss.whyThisMatters!.length).toBeGreaterThan(40);
    });

    it('Exit Ticket có đủ 3 câu: kiến thức, đọc code, tự đánh giá', () => {
      const types = lesson.exitTicket.questions.map((question) => question.type);
      expect(types).toContain('knowledge');
      expect(types).toContain('read-code');
      expect(types).toContain('self-assess');
      expect(lesson.exitTicket.reflectionPrompt.length).toBeGreaterThan(10);
    });

    it('câu tự đánh giá không có đáp án đúng/sai', () => {
      const selfAssess = lesson.exitTicket.questions.filter(
        (question) => question.type === 'self-assess',
      );
      for (const question of selfAssess) {
        expect(question.correctIndex).toBeUndefined();
      }
    });

    it('câu hỏi có chấm điểm đều có đáp án hợp lệ', () => {
      const scored = lesson.exitTicket.questions.filter(
        (question) => question.type !== 'self-assess',
      );
      for (const question of scored) {
        expect(question.correctIndex).toBeDefined();
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(question.options.length);
      }
    });

    describe.each(lesson.challenges.map((challenge) => [challenge.id, challenge] as const))(
      'Challenge %s',
      (_challengeId, challenge) => {
        it('có đủ 3 cấp gợi ý theo đúng thứ tự', () => {
          expect(challenge.hints).toHaveLength(3);
          expect(challenge.hints.map((hint) => hint.level)).toEqual([1, 2, 3]);
          expect(challenge.hints[0].type).toBe('question');
          expect(challenge.hints[1].type).toBe('structure');
          expect(challenge.hints[2].type).toBe('skeleton');
        });

        it('gợi ý cấp 1 không được lộ đáp án — phải là câu hỏi định hướng', () => {
          const firstHint = challenge.hints[0].content;
          expect(firstHint).not.toContain('```');
        });

        it('có ít nhất một test case bắt buộc', () => {
          const required = challenge.testCases.filter((test) => test.required);
          expect(required.length).toBeGreaterThanOrEqual(1);
        });

        it('có phần thưởng XP dương và tình huống mở đầu', () => {
          expect(challenge.xpReward).toBeGreaterThan(0);
          expect(challenge.story.length).toBeGreaterThan(20);
          expect(challenge.instructions.length).toBeGreaterThan(0);
        });

        it('starterCode phân tích được, hoặc cố ý có lỗi ở bài debug', () => {
          const isDebugStyle = challenge.kind === 'debug' || challenge.kind === 'boss';
          let parsed = true;
          try {
            parse(tokenize(challenge.starterCode).tokens);
          } catch {
            parsed = false;
          }

          if (!isDebugStyle) {
            // Bài không phải debug: code khởi đầu phải chạy được, học sinh chỉ điền thêm
            expect(parsed).toBe(true);
          }
        });

        it('đáp án mẫu (nếu có) phải thực sự vượt được challenge', () => {
          if (!challenge.solution) return;

          const result = analyzeChallenge(challenge.solution, challenge);

          // Nếu hỏng, in ra thông báo để người soạn bài biết sửa chỗ nào
          if (!result.isCorrect) {
            throw new Error(
              `Đáp án mẫu của "${challenge.id}" không vượt được challenge.\n` +
                `Thông báo: ${result.diagnostics.map((d) => `[${d.code}] ${d.message}`).join('\n')}\n` +
                `Test: ${result.passedRequired}/${result.totalRequired}`,
            );
          }

          expect(result.isCorrect).toBe(true);
        });

        it('đáp án mẫu đạt chuẩn clean code — code mẫu phải làm gương', () => {
          if (!challenge.solution) return;
          const result = analyzeChallenge(challenge.solution, challenge);
          expect(result.cleanCode.score).toBeGreaterThanOrEqual(80);
        });

        it('starterCode không được vượt sẵn challenge — nếu không thì học sinh chẳng phải làm gì', () => {
          // Node quan sát cố ý cho sẵn code chạy đúng: nhiệm vụ chỉ là đọc và dự đoán
          if (challenge.kind === 'story') return;

          const result = analyzeChallenge(challenge.starterCode, challenge);
          expect(result.isCorrect).toBe(false);
        });

        it('node Clean Code phải có ngưỡng điểm, node khác thì tuyệt đối không', () => {
          if (challenge.kind === 'cleancode') {
            expect(challenge.minCleanCodeScore).toBeGreaterThan(0);
          } else {
            // Mục 11: điểm clean code không được làm học sinh trượt khi code đã đúng
            expect(challenge.minCleanCodeScore).toBeUndefined();
          }
        });
      },
    );
  },
);
