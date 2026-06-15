import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
} from '@packages/entities/transactions';

const VALID_UUID = '36837a9f-f7f2-41a0-b6f5-9d88fe938066';
const OTHER_UUID = '46837a9f-f7f2-41a0-b6f5-9d88fe938067';

// ─── createTransactionSchema ──────────────────────────────────────────────────

describe('createTransactionSchema', () => {
  const base = {
    name: 'Grocery Shopping',
    walletId: VALID_UUID,
    categoryId: OTHER_UUID,
    amount: 150.5,
    type: 'EXPENSE',
  };

  type TC<T = unknown> = { case: string; value: T; isValid: boolean; message: string | null };

  it('accepts a fully valid payload', () => {
    const result = createTransactionSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        name: 'Grocery Shopping',
        walletId: VALID_UUID,
        categoryId: OTHER_UUID,
        amount: 150.5,
        type: 'EXPENSE',
        status: 'COMPLETED',
      });
    }
  });

  // ─── name ─────────────────────────────────────────────────────────────────────
  describe('name ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing', isValid: false, message: 'Name is required' },
      { value: null, case: 'null', isValid: false, message: 'Name is required' },
      { value: 123, case: 'number', isValid: false, message: 'Name is required' },
      { value: true, case: 'boolean', isValid: false, message: 'Name is required' },
      { value: '', case: 'empty string', isValid: false, message: 'Name is required' },
      { value: 'Coffee', case: 'valid string', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createTransactionSchema.safeParse({ ...base, name: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });
  });

  // ─── userId (optional) ────────────────────────────────────────────────────────
  describe('userId ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing (optional)', isValid: true, message: null },
      { value: true, case: 'boolean', isValid: false, message: 'User ID is required' },
      { value: 'not-a-uuid', case: 'invalid UUID', isValid: false, message: 'User ID is invalid' },
      { value: VALID_UUID, case: 'valid UUID', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createTransactionSchema.safeParse({ ...base, userId: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });
  });

  // ─── walletId ─────────────────────────────────────────────────────────────────
  describe('walletId ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing', isValid: false, message: 'Wallet ID is required' },
      { value: null, case: 'null', isValid: false, message: 'Wallet ID is required' },
      { value: 123, case: 'number', isValid: false, message: 'Wallet ID is required' },
      {
        value: 'not-a-uuid',
        case: 'invalid UUID',
        isValid: false,
        message: 'Wallet ID is invalid',
      },
      { value: VALID_UUID, case: 'valid UUID', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createTransactionSchema.safeParse({ ...base, walletId: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });
  });

  // ─── categoryId ───────────────────────────────────────────────────────────────
  describe('categoryId ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing', isValid: false, message: 'Category ID is required' },
      { value: null, case: 'null', isValid: false, message: 'Category ID is required' },
      { value: 123, case: 'number', isValid: false, message: 'Category ID is required' },
      {
        value: 'not-a-uuid',
        case: 'invalid UUID',
        isValid: false,
        message: 'Category ID is invalid',
      },
      { value: OTHER_UUID, case: 'valid UUID', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createTransactionSchema.safeParse({ ...base, categoryId: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });
  });

  // ─── amount ───────────────────────────────────────────────────────────────────
  describe('amount ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing', isValid: false, message: 'Amount is required' },
      { value: null, case: 'null', isValid: false, message: 'Amount is required' },
      { value: '150', case: 'string (not coerced)', isValid: false, message: 'Amount is required' },
      { value: true, case: 'boolean', isValid: false, message: 'Amount is required' },
      { value: 0, case: 'zero (not positive)', isValid: false, message: 'Amount is required' },
      { value: -1, case: 'negative number', isValid: false, message: 'Amount is required' },
      { value: 0.01, case: 'min positive (0.01)', isValid: true, message: null },
      { value: 150.5, case: 'valid positive number', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createTransactionSchema.safeParse({ ...base, amount: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });
  });

  // ─── note (optional) ──────────────────────────────────────────────────────────
  describe('note ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing (optional)', isValid: true, message: null },
      { value: 123, case: 'number', isValid: false, message: 'Note is required' },
      { value: true, case: 'boolean', isValid: false, message: 'Note is required' },
      { value: '', case: 'empty string', isValid: true, message: null },
      { value: 'Paid ATM', case: 'valid string', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createTransactionSchema.safeParse({ ...base, note: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });
  });

  // ─── type ─────────────────────────────────────────────────────────────────────
  describe('type ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing', isValid: false, message: 'Type is required' },
      { value: 'INVALID', case: 'unknown value', isValid: false, message: 'Type is required' },
      {
        value: 'income',
        case: 'lowercase (not accepted)',
        isValid: false,
        message: 'Type is required',
      },
      { value: 123, case: 'number', isValid: false, message: 'Type is required' },
      { value: 'INCOME', case: 'INCOME', isValid: true, message: null },
      { value: 'EXPENSE', case: 'EXPENSE', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createTransactionSchema.safeParse({ ...base, type: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });
  });

  // ─── status ───────────────────────────────────────────────────────────────────
  describe('status ...', () => {
    test.each<TC>([
      { value: 'INVALID', case: 'unknown value', isValid: false, message: 'Status is required' },
      { value: 123, case: 'number', isValid: false, message: 'Status is required' },
      { value: 'PENDING', case: 'PENDING', isValid: true, message: null },
      { value: 'COMPLETED', case: 'COMPLETED', isValid: true, message: null },
      { value: 'CANCELLED', case: 'CANCELLED', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createTransactionSchema.safeParse({ ...base, status: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to COMPLETED when omitted', () => {
      const input = Object.fromEntries(Object.entries(base).filter(([k]) => k !== 'status'));
      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.status).toBe('COMPLETED');
    });
  });
});

// ─── updateTransactionSchema ──────────────────────────────────────────────────

describe('updateTransactionSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(updateTransactionSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial payload — name only', () => {
    expect(updateTransactionSchema.safeParse({ name: 'Rent' }).success).toBe(true);
  });

  it('accepts partial payload — amount and type', () => {
    expect(updateTransactionSchema.safeParse({ amount: 500, type: 'INCOME' }).success).toBe(true);
  });

  it('does not accept userId (omitted from schema)', () => {
    const result = updateTransactionSchema.safeParse({ userId: VALID_UUID, name: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).userId).toBeUndefined();
    }
  });

  it('still validates provided fields — invalid walletId fails', () => {
    const result = updateTransactionSchema.safeParse({ walletId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain('Wallet ID is invalid');
  });

  it('still validates provided fields — invalid type fails', () => {
    const result = updateTransactionSchema.safeParse({ type: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('still validates provided fields — zero amount fails', () => {
    const result = updateTransactionSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain('Amount is required');
  });
});

// ─── getTransactionsQuerySchema ───────────────────────────────────────────────

describe('getTransactionsQuerySchema', () => {
  describe('defaults', () => {
    it('empty object applies defaults', () => {
      const result = getTransactionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });
  });

  // ─── page ─────────────────────────────────────────────────────────────────────
  describe('page ...', () => {
    it('coerces string number', () => {
      const result = getTransactionsQuerySchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.page).toBe(3);
    });

    it('rejects 0 (not positive)', () => {
      expect(getTransactionsQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    });

    it('rejects non-integer', () => {
      expect(getTransactionsQuerySchema.safeParse({ page: 1.5 }).success).toBe(false);
    });

    it('rejects non-numeric string', () => {
      expect(getTransactionsQuerySchema.safeParse({ page: 'abc' }).success).toBe(false);
    });
  });

  // ─── limit ────────────────────────────────────────────────────────────────────
  describe('limit ...', () => {
    it('coerces string number', () => {
      const result = getTransactionsQuerySchema.safeParse({ limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.limit).toBe(50);
    });

    it('accepts boundary values 1 and 100', () => {
      expect(getTransactionsQuerySchema.safeParse({ limit: 1 }).success).toBe(true);
      expect(getTransactionsQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
    });

    it('rejects 101 (above max)', () => {
      expect(getTransactionsQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    });

    it('rejects 0 (not positive)', () => {
      expect(getTransactionsQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    });

    it('rejects non-numeric string', () => {
      expect(getTransactionsQuerySchema.safeParse({ limit: 'abc' }).success).toBe(false);
    });
  });

  // ─── search ───────────────────────────────────────────────────────────────────
  describe('search ...', () => {
    it('optional — omitting is valid', () => {
      const result = getTransactionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBeUndefined();
    });

    it('trims whitespace', () => {
      const result = getTransactionsQuerySchema.safeParse({ search: '  coffee  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBe('coffee');
    });

    it('rejects empty string (min 1 after trim)', () => {
      expect(getTransactionsQuerySchema.safeParse({ search: '' }).success).toBe(false);
    });

    it('rejects whitespace-only string', () => {
      expect(getTransactionsQuerySchema.safeParse({ search: '   ' }).success).toBe(false);
    });
  });

  // ─── walletId / categoryId (optional UUID filters) ───────────────────────────
  describe('walletId ...', () => {
    it('optional — omitting is valid', () => {
      expect(getTransactionsQuerySchema.safeParse({}).success).toBe(true);
    });

    it('accepts valid UUID', () => {
      expect(getTransactionsQuerySchema.safeParse({ walletId: VALID_UUID }).success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = getTransactionsQuerySchema.safeParse({ walletId: 'not-a-uuid' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((i) => i.message)).toContain('Wallet ID is invalid');
    });
  });

  describe('categoryId ...', () => {
    it('optional — omitting is valid', () => {
      expect(getTransactionsQuerySchema.safeParse({}).success).toBe(true);
    });

    it('accepts valid UUID', () => {
      expect(getTransactionsQuerySchema.safeParse({ categoryId: OTHER_UUID }).success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = getTransactionsQuerySchema.safeParse({ categoryId: 'bad-uuid' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((i) => i.message)).toContain('Category ID is invalid');
    });
  });

  // ─── type / status (optional enum filters) ────────────────────────────────────
  describe('type ...', () => {
    test.each(['INCOME', 'EXPENSE'])('%s is accepted', (type) => {
      expect(getTransactionsQuerySchema.safeParse({ type }).success).toBe(true);
    });

    it('optional — omitting is valid', () => {
      const result = getTransactionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.type).toBeUndefined();
    });

    it('rejects unknown value', () => {
      expect(getTransactionsQuerySchema.safeParse({ type: 'DEBIT' }).success).toBe(false);
    });
  });

  describe('status ...', () => {
    test.each(['PENDING', 'COMPLETED', 'CANCELLED'])('%s is accepted', (status) => {
      expect(getTransactionsQuerySchema.safeParse({ status }).success).toBe(true);
    });

    it('optional — omitting is valid', () => {
      const result = getTransactionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.status).toBeUndefined();
    });

    it('rejects unknown value', () => {
      expect(getTransactionsQuerySchema.safeParse({ status: 'FAILED' }).success).toBe(false);
    });
  });

  // ─── from / to (optional date coercion) ──────────────────────────────────────
  describe('from ...', () => {
    it('optional — omitting is valid', () => {
      expect(getTransactionsQuerySchema.safeParse({}).success).toBe(true);
    });

    it('coerces ISO date string to Date', () => {
      const result = getTransactionsQuerySchema.safeParse({ from: '2024-01-01' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.from).toBeInstanceOf(Date);
    });

    it('rejects non-date string', () => {
      expect(getTransactionsQuerySchema.safeParse({ from: 'not-a-date' }).success).toBe(false);
    });
  });

  describe('to ...', () => {
    it('optional — omitting is valid', () => {
      expect(getTransactionsQuerySchema.safeParse({}).success).toBe(true);
    });

    it('coerces ISO date string to Date', () => {
      const result = getTransactionsQuerySchema.safeParse({ to: '2024-12-31' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.to).toBeInstanceOf(Date);
    });

    it('rejects non-date string', () => {
      expect(getTransactionsQuerySchema.safeParse({ to: 'not-a-date' }).success).toBe(false);
    });
  });

  it('accepts a full valid query payload', () => {
    const result = getTransactionsQuerySchema.safeParse({
      page: 2,
      limit: 20,
      search: 'coffee',
      walletId: VALID_UUID,
      categoryId: OTHER_UUID,
      type: 'EXPENSE',
      status: 'COMPLETED',
      from: '2024-01-01',
      to: '2024-12-31',
    });
    expect(result.success).toBe(true);
  });
});
