import type { Challenge, Lesson } from '@/types/content';
import { CORE_LESSONS } from './coreCurriculum';
import { ADVANCED_LESSONS } from './advancedCurriculum';

/**
 * Sổ đăng ký nội dung bài học.
 *
 * Nội dung nằm trong mã nguồn (không nằm trong database) để: quản lý bằng Git,
 * sửa bài không cần migration, tải tức thì, và test được bằng Vitest.
 *
 * Curriculum nền tảng Area 0–6 và tuyến nâng cao Area 7–10 đều data-driven.
 */

function withGuardedRoutes(lesson: Lesson): Lesson {
  if (lesson.order < 4 || lesson.order > 6) return lesson;

  return {
    ...lesson,
    challenges: lesson.challenges.map((challenge) => {
      const world = challenge.world;
      if (world?.kind !== 'map' || !world.terrain) return challenge;

      const occupied = new Set((world.props ?? []).map((prop) => `${prop.col},${prop.row ?? 0}`));
      occupied.add(`${world.startCol},${world.startRow}`);
      occupied.add(`${world.goalCol},${world.goalRow}`);
      const candidates: Array<[number, number]> = [];
      for (let row = 1; row < world.terrain.length - 1; row += 1) {
        for (let col = 1; col < world.cols - 1; col += 1) {
          if (world.terrain[row][col] !== '.' || occupied.has(`${col},${row}`)) continue;
          const touchesRoute = [[1,0],[-1,0],[0,1],[0,-1]].some(([dc, dr]) => world.terrain?.[row + dr]?.[col + dc] === '=');
          if (touchesRoute) candidates.push([col, row]);
          if (candidates.length === 2) break;
        }
        if (candidates.length === 2) break;
      }

      const hasDangerTest = challenge.testCases.some((test) => test.expectedWorld?.dangerHits !== undefined);
      return {
        ...challenge,
        story: `${challenge.story} Từ khu vực này, các nhánh phụ có quái canh gác: tuyến đúng phải vừa đạt mục tiêu vừa không để Byte bị phát hiện.`,
        instructions: [...challenge.instructions, 'Không bước vào ô quái canh gác; mục tiêu an toàn yêu cầu số lần bị phát hiện bằng 0.'],
        world: {
          ...world,
          props: [
            ...(world.props ?? []),
            ...candidates.map(([col, row], index) => ({ id:`${challenge.id}-guard-${index + 1}`, type:'enemy', col, row, state:'blocking' })),
          ],
        },
        testCases: hasDangerTest ? challenge.testCases : [
          ...challenge.testCases,
          { id:`${challenge.id}-safe-route`, name:'Byte không bị quái canh gác phát hiện', kind:'world' as const, expectedWorld:{ dangerHits:0 }, required:true, visible:true },
        ],
      };
    }),
  };
}

export const LESSONS: Lesson[] = [...CORE_LESSONS.map(withGuardedRoutes), ...ADVANCED_LESSONS];

const LESSON_BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));

export function getLesson(lessonId: string): Lesson | undefined {
  return LESSON_BY_ID.get(lessonId);
}

/** Bài học đã có nội dung đầy đủ (dùng để phân biệt với bài mới chỉ có metadata). */
export function isLessonAuthored(lessonId: string): boolean {
  return LESSON_BY_ID.has(lessonId);
}

export function getChallenge(lessonId: string, challengeId: string): Challenge | undefined {
  return getLesson(lessonId)?.challenges.find((challenge) => challenge.id === challengeId);
}

/** Id các nhiệm vụ bắt buộc — dùng để tính phần trăm tiến trình. */
export function getRequiredChallengeIds(lessonId: string): string[] {
  return (
    getLesson(lessonId)
      ?.challenges.filter((challenge) => !challenge.optional)
      .map((challenge) => challenge.id) ?? []
  );
}

export function getChallengeIds(lessonId: string): string[] {
  return getLesson(lessonId)?.challenges.map((challenge) => challenge.id) ?? [];
}

/** Nhiệm vụ Boss của một bài (điều kiện bắt buộc để nhận chứng chỉ). */
export function getBossChallenge(lessonId: string): Challenge | undefined {
  return getLesson(lessonId)?.challenges.find((challenge) => challenge.kind === 'boss');
}

export { CORE_LESSONS, ADVANCED_LESSONS };
