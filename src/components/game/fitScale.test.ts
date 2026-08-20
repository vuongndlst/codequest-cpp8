import { describe, expect, it } from 'vitest';
import { coverScale, FIRST_MISSION_MAX_SCALE, fitScale, MAX_SCALE, MIN_SCALE } from './TileMapStage';

/**
 * Bản đồ KHÔNG ĐƯỢC tràn ra ngoài cột phải của màn hình nhiệm vụ.
 *
 * Kéo ngang giữa lúc đang giải bài thì mất hẳn mạch suy nghĩ — mà bản đồ Boss
 * rộng 9 cột, ở tỉ lệ lớn nhất là 576px, vượt quá cột phải trên laptop nhỏ.
 * Nên tỉ lệ phải tự co theo bề ngang thật của khung.
 */
describe('Chọn tỉ lệ bản đồ theo bề ngang khung', () => {
  it('khung rộng thì phóng to hết cỡ', () => {
    expect(fitScale(4, 1000)).toBe(MAX_SCALE);
  });

  it('chỉ màn nhập môn được mở rộng tới mức trần riêng', () => {
    expect(fitScale(7, 1200, 3, 600, FIRST_MISSION_MAX_SCALE)).toBe(FIRST_MISSION_MAX_SCALE);
    expect(fitScale(7, 1200, 3, 600)).toBe(MAX_SCALE);
  });

  it('khung hẹp thì co lại cho vừa, không tràn', () => {
    // 9 cột × 16px × tỉ lệ 4 = 576px, không lọt vào khung 400px
    const scale = fitScale(9, 400);
    expect(9 * 16 * scale).toBeLessThanOrEqual(400);
  });

  it('không bao giờ nhỏ hơn mức sàn, dù khung hẹp tới đâu', () => {
    expect(fitScale(20, 50)).toBe(MIN_SCALE);
    expect(fitScale(9, 0)).toBe(MAX_SCALE);
  });

  it('không bao giờ lớn hơn mức trần, dù khung rộng tới đâu', () => {
    expect(fitScale(3, 5000)).toBe(MAX_SCALE);
  });

  it('co theo cả chiều cao để bản đồ và ô code cùng nằm trong khung nhìn', () => {
    // 6 hàng × 16px × 6 = 576px, nhưng khung chỉ dành 320px cho bản đồ.
    const scale = fitScale(5, 900, 6, 320);
    expect(6 * 16 * scale).toBeLessThanOrEqual(320);
  });

  it('dùng các nấc 1/16 để lấp gần kín viewport ngang mà không rung kích thước', () => {
    for (const cols of [3, 5, 7, 9, 12]) {
      for (const width of [180, 320, 460, 700, 900]) {
        expect(Number.isInteger(fitScale(cols, width) * 16), `${cols} cột trong ${width}px`).toBe(true);
      }
    }
  });

  it('map ngang 16:9 tận dụng gần hết chiều cao sân chơi', () => {
    const scale = fitScale(16, 1050, 9, 560);
    expect(16 * 16 * scale).toBeGreaterThan(980);
    expect(9 * 16 * scale).toBeLessThanOrEqual(560);
  });

  it('chế độ cover phủ kín viewport và chỉ cắt phần phong cảnh ở mép', () => {
    const scale = coverScale(16, 786, 9, 490);
    expect(16 * 16 * scale).toBeGreaterThanOrEqual(786);
    expect(9 * 16 * scale).toBeGreaterThanOrEqual(490);
  });

  it('kích thước không hợp lệ thì lùi về mức trần thay vì vỡ giao diện', () => {
    expect(fitScale(5, Number.NaN)).toBe(MAX_SCALE);
    expect(fitScale(5, -100)).toBe(MAX_SCALE);
  });

  /** Mọi bản đồ của Khu vực 1 phải lọt vừa khoang map trên laptop phổ thông. */
  it('bản đồ rộng nhất vẫn lọt vào cột phải của laptop 1366px', () => {
    // Cột phải chiếm khoảng 3/5 của vùng nội dung ~1200px, trừ padding
    const rightColumn = 680;
    const widest = 9;

    expect(widest * 16 * fitScale(widest, rightColumn)).toBeLessThanOrEqual(rightColumn);
  });
});
