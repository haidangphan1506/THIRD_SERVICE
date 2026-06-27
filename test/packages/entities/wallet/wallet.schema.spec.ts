import { createWalletSchema } from '@packages/entities/wallet/wallet.schema';

describe('wallet schema ...', () => {
  const baseValidation = {
    name: 'ABC',
    type: 'CASH',
    currency: 'VND',
    categoriesId: [],
    balance: 0,
    note: '',
    isDefault: true,
    isActive: true,
  };

  type TC<T = unknown> = { case: string; value: T; isValid: boolean; message: string | null };

  // ─── name ─────────────────────────────────────────────────────────────────────
  describe('name ...', () => {
    test.each<TC>([
      {
        value: undefined,
        case: 'missing',
        isValid: false,
        message: 'Name wallet must be a string',
      },
      { value: null, case: 'null', isValid: false, message: 'Name wallet must be a string' },
      { value: true, case: 'boolean', isValid: false, message: 'Name wallet must be a string' },
      { value: 123, case: 'number', isValid: false, message: 'Name wallet must be a string' },
      { value: '', case: 'empty string', isValid: false, message: 'Name is required' },
      { value: 'a'.repeat(25), case: 'max length (25)', isValid: true, message: null },
      { value: 'a'.repeat(26), case: 'over max (26)', isValid: false, message: 'Name too long' },
      { value: baseValidation.name, case: 'valid string', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createWalletSchema.safeParse({ ...baseValidation, name: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });
  });

  // ─── type ─────────────────────────────────────────────────────────────────────
  describe('type ...', () => {
    test.each<TC>([
      {
        value: 'INVALID',
        case: 'unknown value',
        isValid: false,
        message: 'Type wallet must be a valid type',
      },
      {
        value: 'cash',
        case: 'lowercase (not accepted)',
        isValid: false,
        message: 'Type wallet must be a valid type',
      },
      { value: 123, case: 'number', isValid: false, message: 'Type wallet must be a valid type' },
      { value: 'CASH', case: 'CASH', isValid: true, message: null },
      { value: 'BANK', case: 'BANK', isValid: true, message: null },
      { value: 'E_WALLET', case: 'E_WALLET', isValid: true, message: null },
      { value: 'CREDIT', case: 'CREDIT', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createWalletSchema.safeParse({ ...baseValidation, type: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to CASH when omitted', () => {
      const input = Object.fromEntries(
        Object.entries(baseValidation).filter(([k]) => k !== 'type'),
      );
      const result = createWalletSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.type).toBe('CASH');
    });
  });

  // ─── currency ─────────────────────────────────────────────────────────────────
  describe('currency ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing (uses default)', isValid: true, message: null },
      { value: null, case: 'null', isValid: false, message: 'Currency must be a string' },
      { value: 123, case: 'number', isValid: false, message: 'Currency must be a string' },
      { value: 'VN', case: 'too short (2 chars)', isValid: false, message: 'Currency is required' },
      { value: 'VNDD', case: 'too long (4 chars)', isValid: false, message: 'Currency too long' },
      { value: 'VND', case: 'exactly 3 chars', isValid: true, message: null },
      { value: 'USD', case: 'USD', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createWalletSchema.safeParse({ ...baseValidation, currency: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to VND when omitted', () => {
      const input = Object.fromEntries(
        Object.entries(baseValidation).filter(([k]) => k !== 'currency'),
      );
      const result = createWalletSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.currency).toBe('VND');
    });
  });

  // ─── categoriesId ──────────────────────────────────────────────────────────────
  describe('categoriesId ...', () => {
    test.each<TC>([
      {
        value: 'not-an-array',
        case: 'string (not array)',
        isValid: false,
        message: 'Categories ID must be an array of valid UUIDs',
      },
      {
        value: 123,
        case: 'number',
        isValid: false,
        message: 'Categories ID must be an array of valid UUIDs',
      },
      {
        value: ['not-a-uuid'],
        case: 'array with invalid UUID',
        isValid: false,
        message: 'Categories ID must be a valid UUID',
      },
      { value: [], case: 'empty array', isValid: true, message: null },
      {
        value: ['36837a9f-f7f2-41a0-b6f5-9d88fe938066'],
        case: 'array with valid UUID',
        isValid: true,
        message: null,
      },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createWalletSchema.safeParse({ ...baseValidation, categoriesId: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to [] when omitted', () => {
      const input = Object.fromEntries(
        Object.entries(baseValidation).filter(([k]) => k !== 'categoriesId'),
      );
      const result = createWalletSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.categoriesId).toEqual([]);
    });
  });

  // ─── balance ──────────────────────────────────────────────────────────────────
  describe('balance ...', () => {
    test.each<TC>([
      {
        value: -1,
        case: 'negative number',
        isValid: false,
        message: 'Balance must be greater than 0',
      },
      {
        value: 'not-a-number',
        case: 'non-numeric string',
        isValid: false,
        message: 'Balance must be a number',
      },
      // z.coerce.number() coerces null→0 and true→1, both pass min(0), so they are valid
      { value: null, case: 'null (coerced to 0)', isValid: true, message: null },
      { value: true, case: 'boolean true (coerced to 1)', isValid: true, message: null },
      { value: false, case: 'boolean false (coerced to 0)', isValid: true, message: null },
      { value: 0, case: 'zero', isValid: true, message: null },
      { value: 100, case: 'positive number', isValid: true, message: null },
      { value: '50', case: 'numeric string (coerced)', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createWalletSchema.safeParse({ ...baseValidation, balance: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to 0 when omitted', () => {
      const input = Object.fromEntries(
        Object.entries(baseValidation).filter(([k]) => k !== 'balance'),
      );
      const result = createWalletSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.balance).toBe(0);
    });
  });

  // ─── note ─────────────────────────────────────────────────────────────────────
  describe('note ...', () => {
    test.each<TC>([
      { value: 123, case: 'number', isValid: false, message: 'Note must be a string' },
      { value: true, case: 'boolean', isValid: false, message: 'Note must be a string' },
      { value: '', case: 'empty string', isValid: true, message: null },
      { value: 'some note', case: 'valid string', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createWalletSchema.safeParse({ ...baseValidation, note: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to empty string when omitted', () => {
      const input = Object.fromEntries(
        Object.entries(baseValidation).filter(([k]) => k !== 'note'),
      );
      const result = createWalletSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.note).toBe('');
    });
  });

  // ─── isDefault ────────────────────────────────────────────────────────────────
  describe('isDefault ...', () => {
    test.each<TC>([
      { value: 'true', case: 'string', isValid: false, message: 'Is default must be a boolean' },
      { value: 1, case: 'number 1', isValid: false, message: 'Is default must be a boolean' },
      { value: true, case: 'true', isValid: true, message: null },
      { value: false, case: 'false', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createWalletSchema.safeParse({ ...baseValidation, isDefault: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to true when omitted', () => {
      const input = Object.fromEntries(
        Object.entries(baseValidation).filter(([k]) => k !== 'isDefault'),
      );
      const result = createWalletSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isDefault).toBe(true);
    });
  });

  // ─── isActive ─────────────────────────────────────────────────────────────────
  describe('isActive ...', () => {
    test.each<TC>([
      { value: 'false', case: 'string', isValid: false, message: 'Is active must be a boolean' },
      { value: 0, case: 'number 0', isValid: false, message: 'Is active must be a boolean' },
      { value: true, case: 'true', isValid: true, message: null },
      { value: false, case: 'false', isValid: true, message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createWalletSchema.safeParse({ ...baseValidation, isActive: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to true when omitted', () => {
      const input = Object.fromEntries(
        Object.entries(baseValidation).filter(([k]) => k !== 'isActive'),
      );
      const result = createWalletSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isActive).toBe(true);
    });
  });

  // ─── full valid payload ───────────────────────────────────────────────────────
  it('accepts a fully valid payload', () => {
    const result = createWalletSchema.safeParse(baseValidation);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        name: baseValidation.name,
        type: 'CASH',
        currency: 'VND',
        categoriesId: [],
        balance: 0,
        note: '',
        isDefault: true,
        isActive: true,
      });
    }
  });
});
