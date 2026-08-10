import { describe, expect, it } from 'vitest';
import { CONCEPTS, LESSON_LEARNING_PATHS } from './curriculum';

describe('curriculum database', () => {
  it('mọi learning path chỉ tham chiếu concept tồn tại và đúng lesson giới thiệu', () => {
    for (const path of Object.values(LESSON_LEARNING_PATHS)) {
      expect(path.lessonId.length).toBeGreaterThan(0);
      for (const conceptId of path.conceptIds) {
        const concept = CONCEPTS[conceptId];
        expect(concept, `${path.lessonId} tham chiếu concept thiếu: ${conceptId}`).toBeDefined();
        expect(concept.introducedInLesson.localeCompare(path.lessonId, undefined, { numeric: true })).toBeLessThanOrEqual(0);
      }
    }
  });

  it('mọi concept phân biệt rõ C++ language hoặc Game API', () => {
    const categories = new Set(Object.values(CONCEPTS).map((concept) => concept.category));
    expect(categories).toEqual(new Set(['cpp-language', 'game-api']));
    for (const concept of Object.values(CONCEPTS)) {
      expect(concept.explanation.length).toBeGreaterThan(30);
      expect(concept.commonMistakes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('mỗi lesson mới có prediction và ít nhất hai hoạt động ngắn, id không trùng', () => {
    const practiceIds = Object.values(LESSON_LEARNING_PATHS).flatMap((path) => {
      expect(path.predictionPrompt.length).toBeGreaterThan(40);
      expect(path.practices.length).toBeGreaterThanOrEqual(2);
      return path.practices.map((practice) => practice.id);
    });
    expect(new Set(practiceIds).size).toBe(practiceIds.length);
  });
});
