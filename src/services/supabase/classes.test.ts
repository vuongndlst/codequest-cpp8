import { describe, expect, it } from 'vitest';
import {
  buildJoinLink,
  validateClassNote,
  validateNewClassName,
  validateSchoolYear,
} from './classes.repo';

describe('Tên lớp khi giáo viên tạo lớp', () => {
  it('bắt buộc nhập', () => {
    expect(validateNewClassName('')).toContain('chưa đặt tên lớp');
    expect(validateNewClassName('   ')).toContain('chưa đặt tên lớp');
  });

  it('nhận tên lớp bình thường', () => {
    expect(validateNewClassName('8A1')).toBeNull();
    expect(validateNewClassName('Lớp 8A1 buổi chiều')).toBeNull();
  });

  /**
   * Giới hạn 40 phải khớp ĐÚNG ràng buộc `check` của cột `classes.name`.
   * Lệch nhau thì giáo viên bấm Lưu và nhận về một thông báo constraint bằng
   * tiếng Anh, không hiểu mình sai ở đâu.
   */
  it('chặn tên dài hơn ràng buộc của database', () => {
    expect(validateNewClassName('a'.repeat(40))).toBeNull();
    expect(validateNewClassName('a'.repeat(41))).toContain('tối đa 40');
  });
});

describe('Năm học và ghi chú', () => {
  it('cho phép để trống vì không bắt buộc', () => {
    expect(validateSchoolYear('')).toBeNull();
    expect(validateClassNote('')).toBeNull();
  });

  it('khớp giới hạn độ dài của database', () => {
    expect(validateSchoolYear('a'.repeat(20))).toBeNull();
    expect(validateSchoolYear('a'.repeat(21))).toContain('tối đa 20');
    expect(validateClassNote('a'.repeat(200))).toBeNull();
    expect(validateClassNote('a'.repeat(201))).toContain('tối đa 200');
  });
});

describe('Link mời vào lớp', () => {
  /**
   * Link phải có dấu `#` vì website chạy HashRouter trên GitHub Pages. Thiếu
   * dấu này thì học sinh bấm vào sẽ nhận 404 từ máy chủ tĩnh — mà lỗi đó chỉ
   * lộ ra khi đã đưa lên chạy thật, không lộ ở máy dev.
   */
  it('trỏ tới trang đăng ký qua HashRouter', () => {
    const link = buildJoinLink('8A1-K7MQ');
    expect(link).toContain('#/auth/register');
  });

  it('điền sẵn mã lớp vào tham số `lop`', () => {
    expect(buildJoinLink('8A1-K7MQ')).toContain('lop=8A1-K7MQ');
  });

  it('mã hoá ký tự đặc biệt để link không vỡ', () => {
    expect(buildJoinLink('8A1 K7MQ')).toContain('lop=8A1%20K7MQ');
  });

  it('không sinh ra hai dấu gạch chéo liền nhau', () => {
    expect(buildJoinLink('8A1-K7MQ')).not.toMatch(/[^:]\/\//);
  });
});
