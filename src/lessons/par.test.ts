import { describe, expect, it } from 'vitest';
import { LESSONS } from '@/lessons';
import { analyzeChallenge } from '@/validators';

/**
 * "Số dòng vàng" phải LUÔN ĐẠT ĐƯỢC.
 *
 * Đây là lỗ hổng nguy hiểm nhất của cơ chế này: nếu người soạn bài đặt mức
 * chuẩn thấp hơn lời giải gọn nhất, học sinh sẽ cố mãi mà không bao giờ được
 * sao thứ hai. Em sẽ nghĩ mình dốt, trong khi lỗi nằm ở đề bài.
 *
 * Lỗi đó im lặng tuyệt đối: bài vẫn chạy, test vẫn xanh, chỉ có học sinh là
 * chịu. Nên phải có test canh.
 */
describe('Số dòng vàng của mọi nhiệm vụ', () => {
  const withPar = LESSONS.flatMap((lesson) =>
    lesson.challenges
      .filter((challenge) => challenge.parStatements !== undefined)
      .map((challenge) => ({ lesson, challenge })),
  );

  it('có ít nhất một nhiệm vụ đặt mức chuẩn', () => {
    expect(withPar.length).toBeGreaterThan(0);
  });

  it('đáp án mẫu của mọi nhiệm vụ đều đạt được mức chuẩn đã đặt', () => {
    for (const { challenge } of withPar) {
      if (!challenge.solution) continue;

      const result = analyzeChallenge(challenge.solution, challenge);
      const par = result.par;

      expect(par, `${challenge.id}: không đếm được số câu lệnh`).not.toBeNull();

      if (par!.meetsPar !== true) {
        throw new Error(
          `Nhiệm vụ "${challenge.id}" đặt số dòng vàng là ${challenge.parStatements}, ` +
            `nhưng chính đáp án mẫu đã dùng tới ${par!.count} câu lệnh. ` +
            'Học sinh sẽ không bao giờ đạt được mức này.',
        );
      }

      expect(par!.meetsPar).toBe(true);
    }
  });

  /**
   * Mức chuẩn quá rộng thì mất tác dụng: giải kiểu gì cũng đạt, và học sinh
   * chẳng có lý do nào để nghĩ về cách làm gọn hơn.
   */
  it('mức chuẩn không được rộng rãi tới mức vô nghĩa', () => {
    for (const { challenge } of withPar) {
      if (!challenge.solution) continue;

      const used = analyzeChallenge(challenge.solution, challenge).par!.count;
      const slack = challenge.parStatements! - used;

      expect(
        slack,
        `${challenge.id}: mức chuẩn ${challenge.parStatements} rộng hơn đáp án mẫu tới ${slack} câu lệnh`,
      ).toBeLessThanOrEqual(2);
    }
  });

  it('mức chuẩn luôn là số dương', () => {
    for (const { challenge } of withPar) {
      expect(challenge.parStatements, `${challenge.id}`).toBeGreaterThan(0);
    }
  });

  /** Bài dọn code chấm theo độ sạch, không phải độ ngắn — đặt mức chuẩn ở đó là lẫn hai việc. */
  it('bài dọn code không đặt số dòng vàng', () => {
    for (const { challenge } of withPar) {
      expect(challenge.kind, `${challenge.id}`).not.toBe('cleancode');
    }
  });
});
