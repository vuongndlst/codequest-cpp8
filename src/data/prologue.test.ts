import { describe, expect, it } from 'vitest';
import { PROLOGUE } from './prologue';
import { LESSONS_META } from './lessons.meta';

describe('Phần mở đầu — Thuật toán là gì', () => {
  it('nêu đủ năm tính chất của thuật toán, mỗi tính chất có ví dụ đạt và chưa đạt', () => {
    expect(PROLOGUE.properties).toHaveLength(5);

    for (const property of PROLOGUE.properties) {
      expect(property.title.length).toBeGreaterThan(10);
      expect(property.body.length).toBeGreaterThan(30);
      // Hai ví dụ phải khác nhau thì mới thấy được ranh giới
      expect(property.good).not.toBe(property.bad);
      expect(property.good.length).toBeGreaterThan(5);
      expect(property.bad.length).toBeGreaterThan(5);
    }
  });

  it('giới thiệu đúng ba khối xây dựng, và cả ba đều trỏ tới khu vực có thật', () => {
    expect(PROLOGUE.buildingBlocks).toHaveLength(3);

    const lessonIds = LESSONS_META.map((lesson) => lesson.id);
    for (const block of PROLOGUE.buildingBlocks) {
      expect(lessonIds).toContain(block.lessonId);
      expect(block.everydayExample.length).toBeGreaterThan(10);
    }

    // Ba khối phải phủ đúng ba kiểu: tuần tự, lặp, rẽ nhánh
    expect(PROLOGUE.buildingBlocks.map((block) => block.id)).toEqual([
      'sequence',
      'repetition',
      'selection',
    ]);
  });

  it('hoạt động sắp xếp có đáp án đầy đủ và không trùng lặp', () => {
    const activity = PROLOGUE.orderingActivity;
    const stepIds = activity.steps.map((step) => step.id);

    expect(activity.correctOrder).toHaveLength(activity.steps.length);
    expect(new Set(activity.correctOrder).size).toBe(activity.correctOrder.length);

    for (const id of activity.correctOrder) {
      expect(stepIds).toContain(id);
    }

    // Các bước phải được đưa ra theo thứ tự ĐÃ XÁO TRỘN, nếu không thì
    // học sinh chỉ cần bấm lần lượt từ trên xuống là xong
    expect(stepIds).not.toEqual(activity.correctOrder);
  });

  it('hoạt động tìm bước mơ hồ có đúng MỘT bước mơ hồ, và bước nào cũng có giải thích', () => {
    const activity = PROLOGUE.ambiguityActivity;
    const ambiguous = activity.steps.filter((step) => step.isAmbiguous);

    expect(ambiguous).toHaveLength(1);
    expect(activity.steps.length).toBeGreaterThanOrEqual(4);

    // Chọn bước nào cũng phải học được điều gì đó, không chỉ bước đúng
    for (const step of activity.steps) {
      expect(step.why.length).toBeGreaterThan(25);
    }
  });

  it('nêu ít nhất bốn hiểu lầm, mỗi cái đều có đính chính và lý do', () => {
    expect(PROLOGUE.misconceptions.length).toBeGreaterThanOrEqual(4);

    for (const item of PROLOGUE.misconceptions) {
      expect(item.wrong.length).toBeGreaterThan(20);
      expect(item.right.length).toBeGreaterThan(20);
      expect(item.why.length).toBeGreaterThan(25);
    }
  });

  /**
   * Guard cho chủ ý thiết kế: phần mở đầu dạy CÁCH NGHĨ RA CÁC BƯỚC, tách hẳn
   * khỏi việc viết bằng ngôn ngữ nào. Lọt một dòng C++ vào đây là đã phá mất
   * ranh giới đó — test này sẽ đỏ ngay.
   */
  it('không chứa bất kỳ cú pháp C++ nào — đây là phần dạy tư duy, không dạy ngôn ngữ', () => {
    const allText = JSON.stringify(PROLOGUE).toLowerCase();

    for (const token of ['#include', 'cout <<', 'int main', 'using namespace', 'endl']) {
      expect(allText).not.toContain(token);
    }
  });

  it('có cầu nối sang Area 0 để học sinh hiểu vì sao cú pháp lại khắt khe', () => {
    expect(PROLOGUE.whyComputersAreStrict.bridge).toContain('Area 0');
    expect(PROLOGUE.whyComputersAreStrict.bridge.length).toBeGreaterThan(80);
  });
});
