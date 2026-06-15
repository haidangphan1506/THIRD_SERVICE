import {
  AUTH_MESSAGES,
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from '@packages/entities';

const validRegister = {
  email: 'dang04223@gmail.com',
  password: 'Haidangphan123@',
  username: 'dang04223',
  firstName: 'Phan Đăng',
  lastName: 'Hải',
};

type TC = { label: string; input: Record<string, unknown>; msg: string };

describe('registerSchema', () => {
  describe('email', () => {
    test.each<TC>([
      { label: 'missing', input: { ...validRegister, email: undefined }, msg: AUTH_MESSAGES.EMAIL_REQUIRED },
      { label: 'invalid format', input: { ...validRegister, email: 'not-an-email' }, msg: AUTH_MESSAGES.EMAIL_INVALID },
      { label: 'missing domain', input: { ...validRegister, email: 'dang04223@' }, msg: AUTH_MESSAGES.EMAIL_INVALID },
    ])('$label → $msg', ({ input, msg }) => {
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(msg);
    });
  });

  describe('password', () => {
    test.each<TC>([
      { label: 'missing', input: { ...validRegister, password: undefined }, msg: AUTH_MESSAGES.PASSWORD_REQUIRED },
      { label: 'too short', input: { ...validRegister, password: 'Ab1@' }, msg: AUTH_MESSAGES.PASSWORD_MIN },
      { label: 'too long', input: { ...validRegister, password: 'Abcdefghijklmnop123@456789' }, msg: AUTH_MESSAGES.PASSWORD_MAX },
      { label: 'no lowercase', input: { ...validRegister, password: 'HAIDANG123@' }, msg: AUTH_MESSAGES.PASSWORD_LOWERCASE },
      { label: 'no uppercase', input: { ...validRegister, password: 'haidang123@' }, msg: AUTH_MESSAGES.PASSWORD_UPPERCASE },
      { label: 'no digit', input: { ...validRegister, password: 'Haidangphan@' }, msg: AUTH_MESSAGES.PASSWORD_DIGIT },
      { label: 'no special char', input: { ...validRegister, password: 'Haidang123' }, msg: AUTH_MESSAGES.PASSWORD_SPECIAL },
    ])('$label → $msg', ({ input, msg }) => {
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      const messages = result.error?.issues.map((i) => i.message);
      expect(messages).toContain(msg);
    });
  });

  describe('firstName', () => {
    test.each<TC>([
      { label: 'missing', input: { ...validRegister, firstName: undefined }, msg: AUTH_MESSAGES.FIRST_NAME_REQUIRED },
      { label: 'empty string', input: { ...validRegister, firstName: '' }, msg: AUTH_MESSAGES.FIRST_NAME_REQUIRED },
    ])('$label → $msg', ({ input, msg }) => {
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(msg);
    });
  });

  test('valid payload passes', () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });
});

describe('loginSchema', () => {
  const validLogin = { email: 'dang04223@gmail.com', password: 'Haidangphan123@' };

  test.each<TC>([
    { label: 'missing email', input: { ...validLogin, email: undefined }, msg: AUTH_MESSAGES.EMAIL_REQUIRED },
    { label: 'missing password', input: { ...validLogin, password: undefined }, msg: AUTH_MESSAGES.PASSWORD_REQUIRED },
    { label: 'no lowercase', input: { ...validLogin, password: 'HAIDANG123@' }, msg: AUTH_MESSAGES.PASSWORD_LOWERCASE },
    { label: 'no uppercase', input: { ...validLogin, password: 'haidang123@' }, msg: AUTH_MESSAGES.PASSWORD_UPPERCASE },
    { label: 'no digit', input: { ...validLogin, password: 'Haidangphan@' }, msg: AUTH_MESSAGES.PASSWORD_DIGIT },
    { label: 'no special char', input: { ...validLogin, password: 'Haidang123' }, msg: AUTH_MESSAGES.PASSWORD_SPECIAL },
  ])('$label → $msg', ({ input, msg }) => {
    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toContain(msg);
  });

  test('valid payload passes', () => {
    expect(loginSchema.safeParse(validLogin).success).toBe(true);
  });
});

describe('resetPasswordSchema', () => {
  const validReset = {
    jti: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    password: 'Haidangphan123@',
    confirmPassword: 'Haidangphan123@',
  };

  test.each<TC>([
    { label: 'no lowercase', input: { ...validReset, password: 'HAIDANGPHAN123@', confirmPassword: 'HAIDANGPHAN123@' }, msg: AUTH_MESSAGES.PASSWORD_LOWERCASE },
    { label: 'no uppercase', input: { ...validReset, password: 'haidangphan123@', confirmPassword: 'haidangphan123@' }, msg: AUTH_MESSAGES.PASSWORD_UPPERCASE },
    { label: 'no digit', input: { ...validReset, password: 'Haidangphan@@@', confirmPassword: 'Haidangphan@@@' }, msg: AUTH_MESSAGES.PASSWORD_DIGIT },
    { label: 'no special char', input: { ...validReset, password: 'Haidangphan123', confirmPassword: 'Haidangphan123' }, msg: AUTH_MESSAGES.PASSWORD_SPECIAL },
    { label: 'password mismatch', input: { ...validReset, confirmPassword: 'Different123@' }, msg: AUTH_MESSAGES.CONFIRM_PASSWORD_MISMATCH },
  ])('$label → $msg', ({ input, msg }) => {
    const result = resetPasswordSchema.safeParse(input);
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toContain(msg);
  });

  test('accepts newPassword alias', () => {
    expect(
      resetPasswordSchema.safeParse({
        jti: validReset.jti,
        confirmPassword: validReset.confirmPassword,
        newPassword: 'Haidangphan123@',
      }).success,
    ).toBe(true);
  });

  test('valid payload passes', () => {
    expect(resetPasswordSchema.safeParse(validReset).success).toBe(true);
  });
});
