import { describe, expect, it } from 'vitest';
import { fitScale } from './TileMapStage';

/**
 * Bản đồ KHÔNG ĐƯỢC tràn ra ngoài cột phải của màn hình nhiệm vụ.
 *
 * Kéo ngang giữa lúc đang giải bài thì mất hẳn mạch suy nghĩ — mà bản đồ Boss
 * rộng 9 cột, ở tỉ lệ lớn nhất là 576px, vượt quá cột phải trên laptop nhỏ.
 * Nên tỉ lệ phải tự co theo bề ngang thật của khung.
 */
describe('Chọn tỉ lệ bản đồ theo bề ngang khung', () => {
  it('khung rộng thì phóng to hết cỡ', () => {
    expect(fitScale(4, 1000)).toBe(4);
  });

  it('khung hẹp thì co lại cho vừa, không tràn', () => {
    // 9 cột × 16px × tỉ lệ 4 = 576px, không lọt vào khung 400px
    const scale = fitScale(9, 400);
    expect(9 * 16 * scale).toBeLessThanOrEqual(400);
  });

  it('không bao giờ nhỏ hơn mức sàn, dù khung hẹp tới đâu', () => {
    expect(fitScale(20, 50)).toBe(2);
    expect(fitScale(9, 0)).toBe(4);
  });

  it('không bao giờ lớn hơn mức trần, dù khung rộng tới đâu', () => {
    expect(fitScale(3, 5000)).toBe(4);
  });

  it('luôn trả về số nguyên — tỉ lệ lẻ làm ảnh pixel bị nhoè', () => {
    for (const cols of [3, 5, 7, 9, 12]) {
      for (const width of [180, 320, 460, 700, 900]) {
        expect(Number.isInteger(fitScale(cols, width)), `${cols} cột trong ${width}px`).toBe(true);
      }
    }
  });

  it('kích thước không hợp lệ thì lùi về mức trần thay vì vỡ giao diện', () => {
    expect(fitScale(5, Number.NaN)).toBe(4);
    expect(fitScale(5, -100)).toBe(4);
  });

  /** Mọi bản đồ của Khu vực 1 phải lọt vừa cột phải trên laptop phổ thông. */
  it('bản đồ rộng nhất vẫn lọt vào cột phải của laptop 1366px', () => {
    // Cột phải chiếm khoảng 3/5 của vùng nội dung ~1200px, trừ padding
    const rightColumn = 680;
    const widest = 9;

    expect(widest * 16 * fitScale(widest, rightColumn)).toBeLessThanOrEqual(rightColumn);
  });
});
