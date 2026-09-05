import { describe, expect, it } from 'vitest';
import {
  MIN_PASSWORD_LENGTH,
  checkPassword,
  normalizeLoginIdentifier,
  studentEmailFromCode,
  validateClassCode,
  validatePassword,
  validatePasswordConfirm,
  validateStudentCode,
} from './auth.service';

describe('Độ dài mật khẩu', () => {
  it('chấp nhận từ 8 ký tự, không ép loại ký tự', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(validatePassword('Abc1234')).toContain('ít nhất 8 ký tự');
    expect(validatePassword('Abc12345')).toBeNull();
    expect(validatePassword('abcdefgh')).toBeNull();
    expect(validatePassword('12345678')).toBeNull();
    expect(validatePassword('Abc1234567')).toBeNull();
  });

  it('nói rõ mật khẩu hiện đang có bao nhiêu ký tự', () => {
    expect(validatePassword('Abc123')).toContain('hiện có 6');
  });

  it('chặn mật khẩu quá dài để không vỡ giới hạn của Supabase', () => {
    expect(validatePassword('a1'.repeat(50))).toContain('tối đa 72');
  });
});

describe('Lời khuyên không cản đăng ký', () => {
  it('nhắc mật khẩu phổ biến nhưng vẫn nhận khi đủ độ dài', () => {
    for (const weak of ['password123', 'matkhau2026', 'qwertyuiop', 'codequest1']) {
      expect(validatePassword(weak)).toBeNull();
      expect(checkPassword(weak).advice.length).toBeGreaterThan(0);
    }
  });

  it('cho phép mật khẩu toàn chữ số', () => {
    expect(validatePassword('1234567890')).toBeNull();
    expect(validatePassword('9876543210')).toBeNull();
  });

  it('chỉ khuyên tránh ký tự lặp lại', () => {
    expect(validatePassword('aaaaaaaaaaaa')).toBeNull();
    expect(checkPassword('aaaaaaaaaaaa').advice.join(' ')).toContain('lặp lại');
  });

  /** Mật khẩu chứa chính tên email là thứ người quen đoán ra đầu tiên. */
  it('không cấm mật khẩu chứa email của chính học sinh', () => {
    const error = validatePassword('nguyenvanan2026', { email: 'nguyenvanan@gmail.com' });
    expect(error).toBeNull();
  });

  it('không bắt buộc hai loại ký tự', () => {
    expect(validatePassword('abcdefghijkl')).toBeNull();
    expect(validatePassword('abcdefghij12')).toBeNull();
  });
});

describe('Đánh giá độ mạnh', () => {
  it('mật khẩu vừa đủ điều kiện thì xếp mức tạm ổn', () => {
    const check = checkPassword('caycau26');
    expect(check.error).toBeNull();
    expect(check.strength).toBe('fair');
  });

  it('mật khẩu dài và nhiều loại ký tự thì xếp mức mạnh', () => {
    const check = checkPassword('MeoCuaEmTen4Chan!');
    expect(check.error).toBeNull();
    expect(check.strength).toBe('strong');
    expect(check.advice).toHaveLength(0);
  });

  /**
   * Theo hướng dẫn của NIST, ĐỘ DÀI quan trọng hơn việc ép đủ loại ký tự.
   * `Abc@1234` đủ bốn nhóm ký tự nhưng chỉ 8 ký tự và nằm trong mọi từ điển dò.
   */
  it('một câu dài dễ nhớ mạnh hơn một từ ngắn có ký tự đặc biệt', () => {
    expect(validatePassword('Abc@1234')).toBeNull();
    expect(checkPassword('ConMeoNhaEmMau3Mau').strength).toBe('strong');
  });

  it('mật khẩu chưa đủ mạnh thì có lời khuyên cụ thể', () => {
    const check = checkPassword('12345678');
    expect(check.advice.length).toBeGreaterThan(0);
    expect(check.error).toBeNull();
  });
  it('giới hạn byte UTF-8 cả với ký tự tiếng Việt', () => {
    expect(validatePassword('ế'.repeat(25))).toContain('72 byte');
    expect(validatePassword('ế'.repeat(8))).toBeNull();
  });
});

describe('Nhập lại mật khẩu', () => {
  it('bắt buộc phải nhập ô thứ hai', () => {
    expect(validatePasswordConfirm('Abc1234567', '')).toContain('chưa nhập lại');
  });

  it('hai ô phải trùng khớp', () => {
    expect(validatePasswordConfirm('Abc1234567', 'Abc1234568')).toContain('chưa giống nhau');
    expect(validatePasswordConfirm('Abc1234567', 'Abc1234567')).toBeNull();
  });
});

describe('Mã lớp', () => {
  it('bắt buộc nhập', () => {
    expect(validateClassCode('')).toContain('chưa nhập mã lớp');
    expect(validateClassCode('   ')).toContain('chưa nhập mã lớp');
  });

  it('nhận mã đúng định dạng', () => {
    expect(validateClassCode('8A1-K7MQ')).toBeNull();
    expect(validateClassCode('LOP-ACDE')).toBeNull();
  });

  it('từ chối mã có ký tự lạ', () => {
    expect(validateClassCode('8A1 K7MQ')).toContain('chữ, số và dấu gạch ngang');
    expect(validateClassCode('8A1@K7MQ')).toContain('chữ, số và dấu gạch ngang');
  });

  it('từ chối mã quá ngắn', () => {
    expect(validateClassCode('AB')).toContain('chưa đúng định dạng');
  });
});

describe('Danh tính học sinh LSTS', () => {
  it('chỉ nhận mã gồm đúng 7 chữ số', () => {
    expect(validateStudentCode('2406105')).toBeNull();
    expect(validateStudentCode('240610')).toContain('7 chữ số');
    expect(validateStudentCode('24A6105')).toContain('7 chữ số');
  });

  it('tạo email trường từ mã học sinh', () => {
    expect(studentEmailFromCode(' 2406105 ')).toBe('2406105@lsts.edu.vn');
    expect(studentEmailFromCode('')).toBe('');
  });

  it('chuẩn hóa mã học sinh thành email trường khi đăng nhập', () => {
    expect(normalizeLoginIdentifier(' 2406105 ')).toBe('2406105@lsts.edu.vn');
    expect(normalizeLoginIdentifier(' Teacher@LSTS.edu.vn ')).toBe('teacher@lsts.edu.vn');
  });
});
