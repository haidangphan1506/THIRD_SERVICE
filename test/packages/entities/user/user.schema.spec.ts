import {
  getUserDetailQuerySchema,
  getUsersQuerySchema,
  dataFieldSchema,
  createUserSchema,
} from '@packages/entities/user';

// ─── getUserDetailQuerySchema ─────────────────────────────────────────────────

describe('getUserDetailQuerySchema', () => {
  describe('defaults', () => {
    test('empty object applies defaults', () => {
      const result = getUserDetailQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual([]);
        expect(result.data.transactionLimit).toBe(50);
      }
    });
  });

  describe('include — preprocess', () => {
    test('comma-separated string is split into array', () => {
      const result = getUserDetailQuerySchema.safeParse({ include: 'wallets,transactions' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual(['wallets', 'transactions']);
      }
    });

    test('array of strings is kept as-is', () => {
      const result = getUserDetailQuerySchema.safeParse({ include: ['wallets', 'categories'] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual(['wallets', 'categories']);
      }
    });

    test('unknown values in include are filtered out', () => {
      const result = getUserDetailQuerySchema.safeParse({
        include: 'wallets,unknown,transactions',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual(['wallets', 'transactions']);
      }
    });

    test('include values are lowercased and trimmed', () => {
      const result = getUserDetailQuerySchema.safeParse({ include: ' WALLETS , Transactions ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual(['wallets', 'transactions']);
      }
    });

    test('all three valid values are accepted', () => {
      const result = getUserDetailQuerySchema.safeParse({
        include: 'wallets,transactions,categories',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual(['wallets', 'transactions', 'categories']);
      }
    });

    test('non-object input is passed through and fails', () => {
      expect(getUserDetailQuerySchema.safeParse(null).success).toBe(false);
      expect(getUserDetailQuerySchema.safeParse([]).success).toBe(false);
    });
  });

  describe('transactionLimit', () => {
    test('coerces string number', () => {
      const result = getUserDetailQuerySchema.safeParse({ transactionLimit: '30' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.transactionLimit).toBe(30);
    });

    test('accepts boundary values 1 and 200', () => {
      expect(getUserDetailQuerySchema.safeParse({ transactionLimit: 1 }).success).toBe(true);
      expect(getUserDetailQuerySchema.safeParse({ transactionLimit: 200 }).success).toBe(true);
    });

    test('rejects 0 (below min)', () => {
      expect(getUserDetailQuerySchema.safeParse({ transactionLimit: 0 }).success).toBe(false);
    });

    test('rejects 201 (above max)', () => {
      expect(getUserDetailQuerySchema.safeParse({ transactionLimit: 201 }).success).toBe(false);
    });

    test('rejects non-integer', () => {
      expect(getUserDetailQuerySchema.safeParse({ transactionLimit: 1.5 }).success).toBe(false);
    });

    test('rejects non-numeric string', () => {
      expect(getUserDetailQuerySchema.safeParse({ transactionLimit: 'abc' }).success).toBe(false);
    });
  });
});

// ─── getUsersQuerySchema ──────────────────────────────────────────────────────

describe('getUsersQuerySchema', () => {
  describe('defaults', () => {
    test('empty object applies defaults', () => {
      const result = getUsersQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe('preprocess — pageSize → limit alias', () => {
    test('converts pageSize to limit when limit is absent', () => {
      const result = getUsersQuerySchema.safeParse({ pageSize: 25 });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.limit).toBe(25);
    });

    test('keeps limit when both pageSize and limit are present', () => {
      const result = getUsersQuerySchema.safeParse({ pageSize: 25, limit: 5 });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.limit).toBe(5);
    });

    test('non-object is passed through preprocess then rejected', () => {
      expect(getUsersQuerySchema.safeParse(null).success).toBe(false);
      expect(getUsersQuerySchema.safeParse([]).success).toBe(false);
    });
  });

  describe('page', () => {
    test('coerces string to number', () => {
      const result = getUsersQuerySchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.page).toBe(3);
    });

    test('rejects 0 (below min 1)', () => {
      expect(getUsersQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    });

    test('rejects non-integer', () => {
      expect(getUsersQuerySchema.safeParse({ page: 1.5 }).success).toBe(false);
    });

    test('rejects non-numeric string', () => {
      expect(getUsersQuerySchema.safeParse({ page: 'abc' }).success).toBe(false);
    });
  });

  describe('limit', () => {
    test('accepts boundary values 1 and 100', () => {
      expect(getUsersQuerySchema.safeParse({ limit: 1 }).success).toBe(true);
      expect(getUsersQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
    });

    test('rejects 101 (above max)', () => {
      expect(getUsersQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    });

    test('rejects 0 (below min)', () => {
      expect(getUsersQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    });

    test('rejects non-numeric string', () => {
      expect(getUsersQuerySchema.safeParse({ limit: 'abc' }).success).toBe(false);
    });
  });

  describe('search', () => {
    test('optional — omitting is valid', () => {
      const result = getUsersQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBeUndefined();
    });

    test('trims whitespace', () => {
      const result = getUsersQuerySchema.safeParse({ search: '  alice  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBe('alice');
    });

    test('rejects empty string (min 1 after trim)', () => {
      expect(getUsersQuerySchema.safeParse({ search: '' }).success).toBe(false);
    });

    test('rejects whitespace-only string', () => {
      expect(getUsersQuerySchema.safeParse({ search: '   ' }).success).toBe(false);
    });
  });

  describe('role', () => {
    test.each(['ADMIN', 'TUTOR', 'PARENT', 'STUDENT'])('%s is accepted', (role) => {
      const result = getUsersQuerySchema.safeParse({ role });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.role).toBe(role);
    });

    test('invalid role is rejected', () => {
      expect(getUsersQuerySchema.safeParse({ role: 'SUPERADMIN' }).success).toBe(false);
    });

    test('optional — omitting is valid', () => {
      const result = getUsersQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.role).toBeUndefined();
    });
  });

  describe('isActive', () => {
    test('"true" is transformed to boolean true', () => {
      const result = getUsersQuerySchema.safeParse({ isActive: 'true' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isActive).toBe(true);
    });

    test('"false" is transformed to boolean false', () => {
      const result = getUsersQuerySchema.safeParse({ isActive: 'false' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isActive).toBe(false);
    });

    test('other strings are rejected', () => {
      expect(getUsersQuerySchema.safeParse({ isActive: '1' }).success).toBe(false);
      expect(getUsersQuerySchema.safeParse({ isActive: 'yes' }).success).toBe(false);
    });

    test('optional — omitting is valid', () => {
      const result = getUsersQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isActive).toBeUndefined();
    });
  });
});

// ─── dataFieldSchema ──────────────────────────────────────────────────────────

describe('dataFieldSchema', () => {
  const valid = { field: 'email', value: 'test@example.com' };

  test('valid input passes', () => {
    expect(dataFieldSchema.safeParse(valid).success).toBe(true);
  });

  type TC = { label: string; input: Record<string, unknown>; path: string; msg: string };

  test.each<TC>([
    {
      label: 'missing field',
      input: { value: valid.value },
      path: 'field',
      msg: 'Field must be string ...',
    },
    {
      label: 'empty field',
      input: { ...valid, field: '' },
      path: 'field',
      msg: 'Too small: expected string to have >=1 characters',
    },
    {
      label: 'field is number',
      input: { ...valid, field: 123 },
      path: 'field',
      msg: 'Field must be string ...',
    },
    {
      label: 'field is boolean',
      input: { ...valid, field: true },
      path: 'field',
      msg: 'Field must be string ...',
    },
    {
      label: 'missing value',
      input: { field: valid.field },
      path: 'value',
      msg: 'Value must be string ...',
    },
    {
      label: 'empty value',
      input: { ...valid, value: '' },
      path: 'value',
      msg: 'Too small: expected string to have >=1 characters',
    },
    {
      label: 'value is number',
      input: { ...valid, value: 456 },
      path: 'value',
      msg: 'Value must be string ...',
    },
    {
      label: 'value is boolean',
      input: { ...valid, value: false },
      path: 'value',
      msg: 'Value must be string ...',
    },
  ])('$label → $msg', ({ input, path, msg }) => {
    const result = dataFieldSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === path);
      expect(issue?.message).toBe(msg);
    }
  });
});

// ─── createUserSchema ─────────────────────────────────────────────────────────

const validUser = {
  email: 'dang04223@gmail.com',
  password: 'Haidang123@',
  firstName: 'Phan Đăng',
  lastName: 'Hải',
};

type TC = { label: string; input: Record<string, unknown>; msg: string };

describe('createUserSchema', () => {
  test('valid payload passes', () => {
    expect(createUserSchema.safeParse(validUser).success).toBe(true);
  });

  test('username is optional', () => {
    const result = createUserSchema.safeParse({ ...validUser, username: undefined });
    expect(result.success).toBe(true);
  });

  // ─── email ──────────────────────────────────────────────────────────────────
  describe('email', () => {
    test.each<TC>([
      { label: 'missing', input: { ...validUser, email: undefined }, msg: 'Email is required' },
      { label: 'null', input: { ...validUser, email: null }, msg: 'Email is required' },
      { label: 'number', input: { ...validUser, email: 123 }, msg: 'Email is required' },
      { label: 'empty string', input: { ...validUser, email: '' }, msg: 'Email is required' },
      {
        label: 'invalid format',
        input: { ...validUser, email: 'not-an-email' },
        msg: 'Invalid email address',
      },
    ])('$label → "$msg"', ({ input, msg }) => {
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'email');
        expect(issue?.message).toBe(msg);
      }
    });
  });

  // ─── username ────────────────────────────────────────────────────────────────
  describe('username', () => {
    test('accepts username up to 100 chars', () => {
      expect(createUserSchema.safeParse({ ...validUser, username: 'a'.repeat(100) }).success).toBe(
        true,
      );
    });

    test('rejects username over 100 chars', () => {
      const result = createUserSchema.safeParse({ ...validUser, username: 'a'.repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'username');
        expect(issue?.message).toBe('Username must be at most 100 characters');
      }
    });

    test('rejects empty string (min 1 after trim)', () => {
      const result = createUserSchema.safeParse({ ...validUser, username: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'username');
        expect(issue?.message).toBe('Username must be at least 1 character');
      }
    });

    test('trims whitespace', () => {
      const result = createUserSchema.safeParse({ ...validUser, username: '  alice  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.username).toBe('alice');
    });
  });

  // ─── firstName ──────────────────────────────────────────────────────────────
  describe('firstName', () => {
    test.each<TC>([
      {
        label: 'missing',
        input: { ...validUser, firstName: undefined },
        msg: 'First name is required',
      },
      { label: 'null', input: { ...validUser, firstName: null }, msg: 'First name is required' },
      { label: 'number', input: { ...validUser, firstName: 123 }, msg: 'First name is required' },
      {
        label: 'empty string',
        input: { ...validUser, firstName: '' },
        msg: 'First name must be at least 2 characters',
      },
      {
        label: 'too short (1 char)',
        input: { ...validUser, firstName: 'A' },
        msg: 'First name must be at least 2 characters',
      },
      {
        label: 'too long (101 chars)',
        input: { ...validUser, firstName: 'A'.repeat(101) },
        msg: 'First name must be at most 100 characters',
      },
    ])('$label → "$msg"', ({ input, msg }) => {
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'firstName');
        expect(issue?.message).toBe(msg);
      }
    });

    test('accepts exactly 2 characters (min boundary)', () => {
      expect(createUserSchema.safeParse({ ...validUser, firstName: 'AB' }).success).toBe(true);
    });

    test('accepts exactly 100 characters (max boundary)', () => {
      expect(createUserSchema.safeParse({ ...validUser, firstName: 'A'.repeat(100) }).success).toBe(
        true,
      );
    });
  });

  // ─── lastName ───────────────────────────────────────────────────────────────
  describe('lastName', () => {
    test.each<TC>([
      {
        label: 'missing',
        input: { ...validUser, lastName: undefined },
        msg: 'Last name is required',
      },
      { label: 'null', input: { ...validUser, lastName: null }, msg: 'Last name is required' },
      { label: 'number', input: { ...validUser, lastName: 123 }, msg: 'Last name is required' },
      {
        label: 'empty string',
        input: { ...validUser, lastName: '' },
        msg: 'Last name must be at least 2 characters',
      },
      {
        label: 'too short (1 char)',
        input: { ...validUser, lastName: 'A' },
        msg: 'Last name must be at least 2 characters',
      },
      {
        label: 'too long (101 chars)',
        input: { ...validUser, lastName: 'A'.repeat(101) },
        msg: 'Last name must be at most 100 characters',
      },
    ])('$label → "$msg"', ({ input, msg }) => {
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'lastName');
        expect(issue?.message).toBe(msg);
      }
    });

    test('accepts exactly 2 characters (min boundary)', () => {
      expect(createUserSchema.safeParse({ ...validUser, lastName: 'AB' }).success).toBe(true);
    });

    test('accepts exactly 100 characters (max boundary)', () => {
      expect(createUserSchema.safeParse({ ...validUser, lastName: 'A'.repeat(100) }).success).toBe(
        true,
      );
    });
  });

  // ─── password ───────────────────────────────────────────────────────────────
  describe('password', () => {
    test.each<TC>([
      {
        label: 'missing',
        input: { ...validUser, password: undefined },
        msg: 'Password is required',
      },
      { label: 'null', input: { ...validUser, password: null }, msg: 'Password is required' },
      { label: 'number', input: { ...validUser, password: 123 }, msg: 'Password is required' },
      {
        label: 'too short (7 chars)',
        input: { ...validUser, password: 'Ab1@abc' },
        msg: 'Password must be at least 8 characters',
      },
      {
        label: 'too long (15 chars)',
        input: { ...validUser, password: 'Haidang123@abcd' },
        msg: 'Password must be at most 14 characters',
      },
    ])('$label → "$msg"', ({ input, msg }) => {
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain(msg);
      }
    });

    test.each<TC>([
      {
        label: 'no lowercase',
        input: { ...validUser, password: 'HAIDANG123@' },
        msg: 'Password must include at least one lowercase letter (a-z)',
      },
      {
        label: 'no uppercase',
        input: { ...validUser, password: 'haidang123@' },
        msg: 'Password must include at least one uppercase letter (A-Z)',
      },
      {
        label: 'no digit',
        input: { ...validUser, password: 'Haidangphan@' },
        msg: 'Password must include at least one digit (0-9)',
      },
      {
        label: 'no special char',
        input: { ...validUser, password: 'Haidang1234' },
        msg: 'Password must include at least one special character (any symbol that is not a letter or digit)',
      },
    ])('$label → "$msg"', ({ input, msg }) => {
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain(msg);
      }
    });

    test('accepts exactly 8 characters (min boundary)', () => {
      expect(createUserSchema.safeParse({ ...validUser, password: 'Haidng1@' }).success).toBe(true);
    });

    test('accepts exactly 14 characters (max boundary)', () => {
      expect(createUserSchema.safeParse({ ...validUser, password: 'Haidangphan12@' }).success).toBe(
        true,
      );
    });
  });
});
