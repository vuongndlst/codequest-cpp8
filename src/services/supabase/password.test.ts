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
  it('yêu cầu tối thiểu 10 ký tự', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(10);
    expect(validatePassword('Abc12345')).toContain('ít nhất 10 ký tự');
    expect(validatePassword('Abc123456')).toContain('ít nhất 10 ký tự');
    expect(validatePassword('Abc1234567')).toBeNull();
  });

  it('nói rõ mật khẩu hiện đang có bao nhiêu ký tự', () => {
    expect(validatePassword('Abc123')).toContain('hiện có 6');
  });

  it('chặn mật khẩu quá dài để không vỡ giới hạn của Supabase', () => {
    expect(validatePassword('a1'.repeat(50))).toContain('tối đa 72');
  });
});

describe('Chặn mật khẩu dễ đoán', () => {
  it('chặn các mật khẩu nằm đầu mọi danh sách dò', () => {
    for (const weak of ['password123', 'matkhau2026', 'qwertyuiop', 'codequest1']) {
      expect(validatePassword(weak)).toContain('danh sách bị đoán đầu tiên');
    }
  });

  it('chặn mật khẩu toàn chữ số', () => {
    expect(validatePassword('1234567890')).toContain('toàn chữ số');
    expect(validatePassword('9876543210')).toContain('toàn chữ số');
  });

  it('chặn mật khẩu chỉ gồm một ký tự lặp lại', () => {
    expect(validatePassword('aaaaaaaaaaaa')).toContain('một ký tự lặp lại');
  });

  /** Mật khẩu chứa chính tên email là thứ người quen đoán ra đầu tiên. */
  it('chặn mật khẩu chứa tên email của chính học sinh', () => {
    const error = validatePassword('nguyenvanan2026', { email: 'nguyenvanan@gmail.com' });
    expect(error).toContain('tên email');
  });

  it('yêu cầu ít nhất hai loại ký tự', () => {
    expect(validatePassword('abcdefghijkl')).toContain('hai loại ký tự');
    expect(validatePassword('abcdefghij12')).toBeNull();
  });
});

describe('Đánh giá độ mạnh', () => {
  it('mật khẩu vừa đủ điều kiện thì xếp mức tạm ổn', () => {
    const check = checkPassword('caycauvong26');
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
    expect(validatePassword('Abc@1234')).not.toBeNull();
    expect(checkPassword('ConMeoNhaEmMau3Mau').strength).toBe('strong');
  });

  it('mật khẩu chưa đủ mạnh thì có lời khuyên cụ thể', () => {
    const check = checkPassword('caycauvong26');
    expect(check.advice.length).toBeGreaterThan(0);
    expect(check.advice.join(' ')).toContain('14 ký tự');
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
