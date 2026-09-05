import { describe, expect, it } from 'vitest';
import { LESSONS } from './index';
import { connectedRouteCells } from '@/components/game/routeGuide';
import { analyzeChallenge } from '@/validators';
import { tokenize } from '@/validators/lexer';
import { parse } from '@/validators/parser';
import type { ExitTicketQuestion } from '@/types/content';

describe('Curriculum Area 0–10', () => {
  it('bài debug tìm kiếm thực sự phát hiện truy cập quá cuối mảng', () => {
    const challenge = LESSONS.find(lesson => lesson.id === 'a9')!.challenges[2];
    expect(analyzeChallenge(challenge.solution!, challenge).isCorrect).toBe(true);
    const faulty = challenge.solution!.replace('i < size', 'i <= size');
    expect(analyzeChallenge(faulty, challenge).isCorrect).toBe(false);
    expect(analyzeChallenge(challenge.starterCode, challenge).isCorrect).toBe(false);
  });

  it('boss tìm kiếm không đạt nếu in cứng chỉ số của ví dụ', () => {
    const challenge = LESSONS.find(lesson => lesson.id === 'a9')!.challenges[3];
    const hardcoded = challenge.solution!.replace('cout << findFirst(codes, 6, target)', 'cout << 3');
    expect(analyzeChallenge(hardcoded, challenge).isCorrect).toBe(false);
  });

  it('có đủ mười một khu vực và 45–55 màn hoàn chỉnh', () => {
    expect(LESSONS.map((lesson) => lesson.id)).toEqual(['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10']);
    const total = LESSONS.reduce((sum, lesson) => sum + lesson.challenges.length, 0);
    expect(total).toBeGreaterThanOrEqual(45);
    expect(total).toBeLessThanOrEqual(55);
  });

  it('mỗi khu vực có tiến trình quan sát/khái niệm, thực hành, debug và boss', () => {
    for (const lesson of LESSONS) {
      const kinds = lesson.challenges.map((challenge) => challenge.kind);
      expect(kinds.some((kind) => kind === 'story' || kind === 'concept')).toBe(true);
      expect(kinds.some((kind) => kind === 'mission' || kind === 'sandbox')).toBe(true);
      expect(kinds).toContain('debug');
      expect(kinds).toContain('boss');
    }
  });

  it('mỗi khu vực công khai chuẩn đầu ra Know–Understand–Do đo được', () => {
    for (const lesson of LESSONS) {
      expect(lesson.learningObjectives.know.length).toBeGreaterThan(0);
      expect(lesson.learningObjectives.understand.length).toBeGreaterThan(40);
      expect(lesson.learningObjectives.do.length).toBeGreaterThanOrEqual(2);
      expect(lesson.learningObjectives.do.every((objective) => objective.length > 15)).toBe(true);
    }
  });

  it('gợi ý cấp 3 của màn tự viết chỉ đưa khung, không chép nguyên đáp án', () => {
    for (const challenge of LESSONS.flatMap((lesson) => lesson.challenges)) {
      if (challenge.kind === 'story' || challenge.kind === 'debug') continue;
      const finalHint = challenge.hints.find((hint) => hint.level === 3)?.content ?? '';
      const normalizedHint = finalHint.replace(/\s+/g, ' ').trim();
      const normalizedSolution = (challenge.solution ?? '').replace(/\s+/g, ' ').trim();
      expect(normalizedHint).not.toContain(normalizedSolution);
    }
  });

  it('các map thực hành là viewport ngang 16:9 và mọi vật thể đều nằm trong sân', () => {
    const maps = LESSONS.flatMap((lesson) => lesson.challenges)
      .map((challenge) => challenge.world)
      .filter((world) => world?.kind === 'map');

    expect(maps.length).toBeGreaterThan(0);
    for (const world of maps) {
      expect(world?.cols).toBe(16);
      expect(world?.rows).toBe(9);
      expect(world?.terrain).toHaveLength(9);
      expect(world?.terrain?.every((row) => row.length === 16)).toBe(true);
      for (const prop of world?.props ?? []) {
        expect(prop.col).toBeGreaterThanOrEqual(0);
        expect(prop.col).toBeLessThan(16);
        expect(prop.row ?? 0).toBeGreaterThanOrEqual(0);
        expect(prop.row ?? 0).toBeLessThan(9);
      }
    }
  });

  it('mọi map khu vực 1–6 đều khai báo tuyến sáng nối điểm xuất phát với đích', () => {
    const challenges = LESSONS
      .filter((lesson) => lesson.id !== 'a0')
      .flatMap((lesson) => lesson.challenges.map((challenge) => ({ lessonId: lesson.id, challenge })));

    for (const { lessonId, challenge } of challenges) {
      const world = challenge.world;
      expect(world?.kind, `${lessonId}/${challenge.id}`).toBe('map');
      const routeCount = world?.terrain?.join('').split('').filter((glyph) => glyph === '=').length ?? 0;
      expect(routeCount, `${lessonId}/${challenge.id}`).toBeGreaterThan(0);
      expect(world?.startCol, `${lessonId}/${challenge.id} thiếu điểm xuất phát`).toBeTypeOf('number');
      expect(world?.startRow, `${lessonId}/${challenge.id} thiếu hàng xuất phát`).toBeTypeOf('number');
      expect(world?.goalCol, `${lessonId}/${challenge.id} thiếu đích`).toBeTypeOf('number');
      expect(world?.goalRow, `${lessonId}/${challenge.id} thiếu hàng đích`).toBeTypeOf('number');
      const connected = connectedRouteCells(world!);
      expect(
        connected.has(`${world?.goalCol},${world?.goalRow}`),
        `${lessonId}/${challenge.id} có tuyến sáng nhưng không nối từ điểm xuất phát tới đích`,
      ).toBe(true);
      expect(
        connected.size,
        `${lessonId}/${challenge.id} có ô đường sáng bị cô lập`,
      ).toBe(routeCount + Number(world?.terrain?.[world.startRow!]?.[world.startCol!] !== '=') + Number(world?.terrain?.[world.goalRow!]?.[world.goalCol!] !== '='));
    }
  });

  it('chuỗi map Area 1 tăng dần số bước từ quan sát tới Boss', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a1');
    const moveCounts = area?.challenges.map((challenge) =>
      analyzeChallenge(challenge.solution!, challenge).worldEvents
        .filter((event) => event.type === 'move').length,
    );
    expect(moveCounts).toEqual([3, 4, 8, 9, 11]);
  });

  it('mọi nhiệm vụ Area 2 đều có map và tăng dần 3–4–6–8–10 bước', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a2');
    expect(area?.challenges.every((challenge) => challenge.world?.kind === 'map')).toBe(true);
    const moveCounts = area?.challenges.map((challenge) =>
      analyzeChallenge(challenge.solution!, challenge).worldEvents
        .filter((event) => event.type === 'move').length,
    );
    expect(moveCounts).toEqual([3, 4, 6, 8, 10]);
  });

  it('chuỗi map Area 3 tăng đều số bước và độ phức tạp tới Boss', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a3');
    const moveCounts = area?.challenges.map((challenge) =>
      analyzeChallenge(challenge.solution!, challenge).worldEvents
        .filter((event) => event.type === 'move').length,
    );
    expect(moveCounts).toEqual([4, 6, 7, 8, 12]);
  });

  it('Area 4 tăng dần quãng đường và kiểm thử đủ hai nhánh ở các màn có dữ liệu', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a4');
    const moveCounts = area?.challenges.map((challenge) =>
      analyzeChallenge(challenge.solution!, challenge).worldEvents
        .filter((event) => event.type === 'move').length,
    );
    expect(moveCounts).toEqual([4, 5, 7, 9, 13]);
    for (const challenge of area?.challenges.filter((item) => item.testCases.some((test) => test.input)) ?? []) {
      const inputs = new Set(challenge.testCases.map((test) => test.input).filter(Boolean));
      expect(inputs.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('các màn tự viết Area 4 chỉ đưa khung gợi ý, không đưa sẵn lời giải', () => {
    const authoredChallenges = LESSONS.find((lesson) => lesson.id === 'a4')?.challenges
      .filter((challenge) => challenge.kind !== 'story' && challenge.kind !== 'debug') ?? [];

    for (const challenge of authoredChallenges) {
      expect(challenge.hints[2].content, challenge.id).toContain('___');
    }
  });

  it('Area 4 kiểm tra trạng thái thế giới ở cả nhánh đúng và nhánh sai', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a4');
    for (const challengeId of ['a4-c2-two-branches', 'a4-c4-debug-equality', 'a4-c5-decision-gate']) {
      const challenge = area?.challenges.find((item) => item.id === challengeId);
      const worldTests = challenge?.testCases.filter((test) => test.kind === 'world') ?? [];
      expect(new Set(worldTests.map((test) => test.input)).size, challengeId).toBeGreaterThanOrEqual(2);
    }
  });

  it('Area 4 có quái canh gác thật và mục tiêu né quái', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a4');
    for (const challenge of area?.challenges ?? []) {
      expect(challenge.world?.props?.some((prop) => prop.type === 'enemy' && prop.state === 'blocking'), challenge.id).toBe(true);
      expect(challenge.testCases.some((test) => test.expectedWorld?.dangerHits === 0), challenge.id).toBe(true);
    }
  });

  it('Area 2 cập nhật biến từ trạng thái game thay vì viết cứng số Gem', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a2');
    const updateChallenge = area?.challenges.find((challenge) => challenge.id === 'a2-c4-debug-update');

    expect(updateChallenge?.requiredPatterns).toContain('call:gemsCollected');
    expect(updateChallenge?.solution).toContain('gems + gemsCollected()');
    expect(updateChallenge?.solution).not.toContain('gems = gems + 2;');
  });

  it('các màn tự viết Area 2–3 có khung gợi ý còn chỗ học sinh hoàn thiện', () => {
    const authoredChallenges = LESSONS
      .filter((lesson) => lesson.id === 'a2' || lesson.id === 'a3')
      .flatMap((lesson) => lesson.challenges)
      .filter((challenge) => challenge.kind !== 'story' && challenge.kind !== 'debug');

    for (const challenge of authoredChallenges) {
      expect(challenge.hints[2].content, challenge.id).toContain('___');
    }
  });

  it('Area 2–3 không dùng Boss giả làm vật trang trí', () => {
    const props = LESSONS
      .filter((lesson) => lesson.id === 'a2' || lesson.id === 'a3')
      .flatMap((lesson) => lesson.challenges)
      .flatMap((challenge) => challenge.world?.props ?? []);

    expect(props.filter((prop) => prop.type === 'boss' && prop.state === 'decorative')).toHaveLength(0);
  });

  it('Area 2 không dùng quái vật làm lệch trọng tâm dữ liệu; Area 3 luôn có thiết bị phản hồi', () => {
    const area2Props = LESSONS.find((lesson) => lesson.id === 'a2')?.challenges
      .flatMap((challenge) => challenge.world?.props ?? []) ?? [];
    expect(area2Props.some((prop) => ['enemy', 'bot', 'boss'].includes(prop.type))).toBe(false);

    const area3 = LESSONS.find((lesson) => lesson.id === 'a3');
    for (const challenge of area3?.challenges ?? []) {
      const types = new Set(challenge.world?.props?.map((prop) => prop.type) ?? []);
      expect(types.has('machine') || types.has('switch')).toBe(true);
    }
  });

  it('Area 5 tăng dần quãng đường và Boss phá đúng năm lớp giáp', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a5');
    const results = area?.challenges.map((challenge) => analyzeChallenge(challenge.solution!, challenge));
    expect(results?.map((result) => result.worldEvents.filter((event) => event.type === 'move').length)).toEqual([6,7,9,11,12]);
    expect(results?.at(-1)?.worldEvents.filter((event) => event.type === 'attack-bug')).toHaveLength(5);
    expect(results?.at(-1)?.finalWorld?.bugHp).toBe(0);
    expect(results?.at(-1)?.finalWorld?.bugHits).toBe(5);
  });

  it('màn đầu Area 5 cho sẵn khung for để học sinh chỉ tập trung vào thân vòng lặp', () => {
    const firstLoop = LESSONS.find((lesson) => lesson.id === 'a5')?.challenges[0];
    expect(firstLoop?.starterCode).toContain('for (int i = 0; i < steps; i++)');
    expect(firstLoop?.starterCode).not.toContain('moveRight();');
  });

  it('Boss Area 5 không chấp nhận vòng đánh thừa dù HP cuối vẫn bằng 0', () => {
    const boss = LESSONS.find((lesson) => lesson.id === 'a5')?.challenges.at(-1);
    expect(boss?.solution).toBeTruthy();
    const sixHitCode = boss!.solution!.replace('hit < 5', 'hit < 6');
    const result = analyzeChallenge(sixHitCode, boss!);

    expect(result.finalWorld?.bugHp).toBe(0);
    expect(result.finalWorld?.bugHits).toBe(6);
    expect(result.isCorrect).toBe(false);
    expect(result.testResults.find((test) => test.id === 'a5-c5-world')?.passed).toBe(false);
  });

  it('các màn tự viết Area 5 chỉ đưa khung gợi ý và Boss bắt buộc đủ năm vòng lặp', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a5');
    const authoredChallenges = area?.challenges.filter((challenge) => challenge.kind !== 'story' && challenge.kind !== 'debug') ?? [];

    for (const challenge of authoredChallenges) {
      expect(challenge.hints[2].content, challenge.id).toContain('___');
    }
    expect(area?.challenges.at(-1)?.requiredPatterns).toContain('stmt:for:count>=5');
  });

  it('Area 5 dùng quái canh gác có va chạm, không phải vật trang trí', () => {
    const nonBossProps = LESSONS.find((lesson) => lesson.id === 'a5')?.challenges
      .filter((challenge) => challenge.kind !== 'boss')
      .flatMap((challenge) => challenge.world?.props ?? []) ?? [];

    expect(nonBossProps.some((prop) => prop.type === 'enemy' && prop.state === 'blocking')).toBe(true);
  });

  it('Area 6 tăng dần từ định nghĩa hàm tới phân rã Boss và mọi gợi ý tự viết còn chỗ trống', () => {
    const area = LESSONS.find((lesson) => lesson.id === 'a6');
    const results = area?.challenges.map((challenge) => analyzeChallenge(challenge.solution!, challenge));
    expect(results?.map((result) => result.worldEvents.filter((event) => event.type === 'move').length)).toEqual([6, 9, 8, 9, 12]);

    for (const challenge of area?.challenges.filter((item) => item.kind !== 'debug') ?? []) {
      expect(challenge.hints[2].content, challenge.id).toContain('___');
    }
    expect(results?.at(-1)?.worldEvents.filter((event) => event.type === 'attack-bug')).toHaveLength(6);
    expect(results?.at(-1)?.finalWorld?.bugHp).toBe(0);
    expect(results?.at(-1)?.finalWorld?.bugHits).toBe(6);
    expect(area?.challenges[0].starterCode).toContain('for (int i = 0; i < 6; i++)');
    expect(area?.challenges[0].starterCode).not.toContain('moveRight();');
    const firstEvents = results?.[0]?.worldEvents ?? [];
    const callIndex = firstEvents.findIndex((event) => event.type === 'call-func');
    const returnIndex = firstEvents.findIndex((event) => event.type === 'return-func');
    expect(callIndex).toBeGreaterThanOrEqual(0);
    expect(firstEvents.filter((event) => event.type === 'turn-on-light')).toHaveLength(6);
    expect(returnIndex).toBeGreaterThan(callIndex);
  });

  it('Boss Area 6 không chấp nhận mô-đun đánh thừa một đòn', () => {
    const boss = LESSONS.find((lesson) => lesson.id === 'a6')?.challenges.at(-1);
    expect(boss).toBeDefined();
    const overAttack = boss!.solution!.replace('i < hits', 'i <= hits');
    const result = analyzeChallenge(overAttack, boss!);

    expect(result.finalWorld?.bugHp).toBe(0);
    expect(result.finalWorld?.bugHits).toBe(7);
    expect(result.testResults.find((test) => test.id === 'a6-c5-world')?.passed).toBe(false);
  });

  it('Area 6 kết hợp thiết bị với tuyến né quái có kiểm chứng', () => {
    const nonBossProps = LESSONS.find((lesson) => lesson.id === 'a6')?.challenges
      .filter((challenge) => challenge.kind !== 'boss')
      .flatMap((challenge) => challenge.world?.props ?? []) ?? [];

    expect(nonBossProps.some((prop) => prop.type === 'enemy' && prop.state === 'blocking')).toBe(true);
  });
});

describe.each(LESSONS.map((lesson) => [lesson.id, lesson] as const))(
  'Nội dung khu vực %s',
  (_lessonId, lesson) => {
    it('có hướng dẫn tư duy đầy đủ', () => {
      const guide = lesson.conceptGuide;
      expect(guide.lessonId).toBe(lesson.id);
      expect(guide.bigQuestion).toContain('?');
      expect(guide.problem.painfulExample.length).toBeGreaterThan(20);
      expect(guide.solution.cleanExample.length).toBeGreaterThan(20);
      expect(guide.thinkingSteps.length).toBeGreaterThanOrEqual(4);
      expect(guide.misconceptions.length).toBeGreaterThanOrEqual(3);
    });

    it('checkpoint có 8–12 câu, ít nhất 5 dạng và có tự đánh giá', () => {
      const questions = lesson.exitTicket.questions;
      expect(questions.length).toBeGreaterThanOrEqual(8);
      expect(questions.length).toBeLessThanOrEqual(12);
      expect(new Set(questions.map((question) => question.type)).size).toBeGreaterThanOrEqual(5);
      expect(questions.some((question) => question.type === 'self-assess')).toBe(true);
      for (const question of questions.filter((item) => item.type !== 'self-assess')) {
        assertValidCheckpointAnswer(question);
      }
    });

    describe.each(lesson.challenges.map((challenge) => [challenge.id, challenge] as const))(
      'Màn %s',
      (_challengeId, challenge) => {
        it('có mục tiêu, phần thưởng và ba cấp gợi ý tăng dần', () => {
          expect(challenge.story.length).toBeGreaterThan(20);
          expect(challenge.instructions.length).toBeGreaterThan(0);
          expect(challenge.testCases.some((test) => test.required)).toBe(true);
          expect(challenge.xpReward).toBeGreaterThan(0);
          expect(challenge.hints.map((hint) => hint.level)).toEqual([1, 2, 3]);
          expect(challenge.hints.map((hint) => hint.type)).toEqual(['question', 'structure', 'skeleton']);
          expect(challenge.hints[0].content).not.toContain('```');
        });

        it('starter code phân tích được, trừ màn debug cú pháp có chủ đích', () => {
          let parsed = true;
          try { parse(tokenize(challenge.starterCode).tokens); } catch { parsed = false; }
          if (challenge.kind !== 'debug') expect(parsed).toBe(true);
        });

        it('đáp án mẫu thật sự vượt qua tất cả mục tiêu bắt buộc', () => {
          expect(challenge.solution).toBeTruthy();
          const result = analyzeChallenge(challenge.solution!, challenge);
          if (!result.isCorrect) {
            throw new Error(`${challenge.id}: ${result.diagnostics.map((item) => `[${item.code}] ${item.message}`).join('\n')}`);
          }
          expect(result.isCorrect).toBe(true);
          expect(result.cleanCode.score).toBeGreaterThanOrEqual(80);
        });

        it('starter code chưa vượt sẵn, trừ màn quan sát', () => {
          if (challenge.kind === 'story') return;
          expect(analyzeChallenge(challenge.starterCode, challenge).isCorrect).toBe(false);
        });
      },
    );
  },
);

describe('Trạm 0 là một chuỗi nhiệm vụ game có thể quan sát và kiểm chứng', () => {
  const area = LESSONS.find((lesson) => lesson.id === 'a0')!;

  it('mọi nhiệm vụ đều có map tín hiệu, trạm lửa, cổng và dữ liệu đích', () => {
    for (const challenge of area.challenges) {
      expect(challenge.world?.kind, challenge.id).toBe('signal-tower');
      expect(challenge.world?.props?.some((prop) => ['light', 'torch'].includes(prop.type)), challenge.id).toBe(true);
      expect(challenge.world?.props?.some((prop) => prop.type === 'gate'), challenge.id).toBe(true);
      expect(challenge.world?.initialState?.expectedSignals, challenge.id).toBeInstanceOf(Array);
    }
  });

  it('số tín hiệu đích khớp số dòng output của đáp án mẫu', () => {
    for (const challenge of area.challenges) {
      const expected = challenge.world?.initialState?.expectedSignals as string[];
      const prints = analyzeChallenge(challenge.solution!, challenge).worldEvents
        .filter((event) => event.type === 'print')
        .map((event) => typeof event.detail?.text === 'string' ? event.detail.text.trim() : event.detail?.text);
      expect(prints, challenge.id).toEqual(expected);
    }
  });

  it('checkpoint có bài vận dụng tình huống trước câu tự đánh giá', () => {
    expect(area.exitTicket.questions).toHaveLength(9);
    expect(area.exitTicket.questions.at(-2)?.type).toBe('scenario');
    expect(area.exitTicket.questions.at(-1)?.type).toBe('self-assess');
  });
});

function assertValidCheckpointAnswer(question: ExitTicketQuestion) {
  if (question.type === 'multiple-answer') {
    expect(question.correctIndices?.length).toBeGreaterThanOrEqual(2);
    return;
  }
  if (question.type === 'ordering') {
    expect(question.correctOrder).toHaveLength(question.options.length);
    return;
  }
  if (question.type === 'matching') {
    expect(question.matches?.length).toBeGreaterThan(0);
    return;
  }
  if (question.type === 'fill-code') {
    expect(question.acceptedAnswers?.length).toBeGreaterThan(0);
    return;
  }
  expect(question.correctIndex).toBeDefined();
}
