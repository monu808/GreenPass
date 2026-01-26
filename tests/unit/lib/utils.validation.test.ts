import {
  validateEmail,
  validatePhone,
  validateIdProof,
  validateIdProofByType,
  validateAge,
  validatePinCode,
  validateAddress,
  validateGender,
  validateName,
  validateGroupName,
  validateDateRange,
  sanitizeInput,
  validateGroupSize
} from '@/lib/utils';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.in')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
      expect(validateEmail('a'.repeat(255) + '@test.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid Indian mobile numbers', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('+919876543210')).toBe(true);
      expect(validatePhone('09876543210')).toBe(true);
    });

    it('should return true for international numbers', () => {
      expect(validatePhone('+12345678901')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(validatePhone('12345')).toBe(false);
      expect(validatePhone('abcdefghij')).toBe(false);
    });
  });

  describe('validateIdProofByType', () => {
    it('should validate Aadhaar correctly', () => {
      expect(validateIdProofByType('123456789012', 'aadhaar').valid).toBe(true);
      expect(validateIdProofByType('12345678901', 'aadhaar').valid).toBe(false);
      expect(validateIdProofByType('12345678901A', 'aadhaar').valid).toBe(false);
    });

    it('should validate PAN correctly', () => {
      expect(validateIdProofByType('ABCDE1234F', 'pan').valid).toBe(true);
      expect(validateIdProofByType('ABCDE12345', 'pan').valid).toBe(false);
    });

    it('should validate Passport correctly', () => {
      expect(validateIdProofByType('A1234567', 'passport').valid).toBe(true);
      expect(validateIdProofByType('AB1234567', 'passport').valid).toBe(true);
      expect(validateIdProofByType('12345678', 'passport').valid).toBe(false);
    });

    it('should validate Driving License correctly', () => {
      expect(validateIdProofByType('DL1420110012345', 'driving-license').valid).toBe(true);
      expect(validateIdProofByType('DL-1420110012345', 'driving-license').valid).toBe(true);
    });

    it('should validate Voter ID correctly', () => {
      expect(validateIdProofByType('ABC1234567', 'voter-id').valid).toBe(true);
      expect(validateIdProofByType('AB12345678', 'voter-id').valid).toBe(false);
    });

    it('should return false for unknown ID type', () => {
      expect(validateIdProofByType('12345678', 'unknown').valid).toBe(false);
    });
  });

  describe('validateAge', () => {
    it('should return true for ages between 18 and 120', () => {
      expect(validateAge(18).valid).toBe(true);
      expect(validateAge(25).valid).toBe(true);
      expect(validateAge(120).valid).toBe(true);
      expect(validateAge('30').valid).toBe(true);
    });

    it('should return false for ages outside range', () => {
      expect(validateAge(17).valid).toBe(false);
      expect(validateAge(121).valid).toBe(false);
      expect(validateAge('not-a-number').valid).toBe(false);
      expect(validateAge(25.5).valid).toBe(false);
    });
  });

  describe('validatePinCode', () => {
    it('should return true for valid 6-digit PIN codes', () => {
      expect(validatePinCode('110001').valid).toBe(true);
      expect(validatePinCode('400001').valid).toBe(true);
    });

    it('should return false for invalid PIN codes', () => {
      expect(validatePinCode('011001').valid).toBe(false);
      expect(validatePinCode('11000').valid).toBe(false);
      expect(validatePinCode('1100012').valid).toBe(false);
      expect(validatePinCode('ABCDEF').valid).toBe(false);
    });
  });

  describe('validateAddress', () => {
    it('should return true for valid addresses', () => {
      expect(validateAddress('123, Main Street, New Delhi, India').valid).toBe(true);
    });

    it('should return false for too short or too long addresses', () => {
      expect(validateAddress('Short').valid).toBe(false);
      expect(validateAddress('a'.repeat(501)).valid).toBe(false);
    });

    it('should reject HTML tags', () => {
      expect(validateAddress('Address with <script>alert(1)</script>').valid).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    it('should return true for valid future date ranges', () => {
      expect(validateDateRange(tomorrow, nextWeek).valid).toBe(true);
    });

    it('should return false if check-out is before or same as check-in', () => {
      expect(validateDateRange(tomorrow, tomorrow).valid).toBe(false);
      expect(validateDateRange(nextWeek, tomorrow).valid).toBe(false);
    });

    it('should enforce minAdvanceDays', () => {
      expect(validateDateRange(today, tomorrow, { minAdvanceDays: 1 }).valid).toBe(false);
    });

    it('should enforce maxStayDays', () => {
      const longStay = new Date(Date.now() + 32 * 86400000).toISOString().split('T')[0];
      expect(validateDateRange(tomorrow, longStay, { maxStayDays: 30 }).valid).toBe(false);
    });

    it('should reject dates more than 1 year in advance', () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 2);
      const farFutureStr = farFuture.toISOString().split('T')[0];
      const farFutureEnd = new Date(farFuture.getTime() + 86400000).toISOString().split('T')[0];
      expect(validateDateRange(farFutureStr, farFutureEnd).valid).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags and escape special characters', () => {
      const input = '<script>alert("XSS")</script> Hello & Welcome!';
      const expected = 'alert(&quot;XSS&quot;) Hello &amp; Welcome!';
      expect(sanitizeInput(input)).toBe(expected);
    });

    it('should handle null/undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  describe('validateGroupSize', () => {
    it('should return true for valid group sizes', () => {
      expect(validateGroupSize(1).valid).toBe(true);
      expect(validateGroupSize(5).valid).toBe(true);
      expect(validateGroupSize('3').valid).toBe(true);
    });

    it('should return false for invalid group sizes', () => {
      expect(validateGroupSize(0).valid).toBe(false);
      expect(validateGroupSize(11).valid).toBe(false);
      expect(validateGroupSize('not-a-number').valid).toBe(false);
      expect(validateGroupSize(2.5).valid).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should return true for valid names', () => {
      expect(validateName('John Doe').valid).toBe(true);
      expect(validateName('Anne-Marie').valid).toBe(true);
      expect(validateName("O'Connor").valid).toBe(true);
    });

    it('should return false for invalid names', () => {
      expect(validateName('A').valid).toBe(false);
      expect(validateName('123').valid).toBe(false);
      expect(validateName('John@Doe').valid).toBe(false);
    });
  });
});
