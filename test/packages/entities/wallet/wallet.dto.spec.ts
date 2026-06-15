import { updateWalletSchema } from '@packages/entities/wallet/wallet.dto';

describe('updateWalletSchema', () => {
  it('should allow empty object because all fields are optional', () => {
    const result = updateWalletSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('should allow partial data', () => {
    const result = updateWalletSchema.safeParse({
      name: 'Wallet A',
    });

    expect(result.success).toBe(true);
  });

  it('should validate provided fields', () => {
    const result = updateWalletSchema.safeParse({
      balance: 1000,
    });

    expect(result.success).toBe(true);
  });
});
