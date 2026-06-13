import {
  balanceEffect,
  createDeltas,
  deleteDeltas,
  updateDeltas,
  type BalanceState,
} from '../../../src/features/transaction/transaction.balance';

const W1 = '11111111-1111-4111-8111-111111111111';
const W2 = '22222222-2222-4222-8222-222222222222';

describe('transaction balance math', () => {
  describe('balanceEffect', () => {
    it('adds for completed income', () => {
      expect(balanceEffect('INCOME', 100, 'COMPLETED')).toBe(100);
    });

    it('subtracts for completed expense', () => {
      expect(balanceEffect('EXPENSE', 100, 'COMPLETED')).toBe(-100);
    });

    it('is zero for non-completed status', () => {
      expect(balanceEffect('INCOME', 100, 'PENDING')).toBe(0);
      expect(balanceEffect('EXPENSE', 100, 'CANCELLED')).toBe(0);
    });
  });

  describe('createDeltas', () => {
    it('applies the signed effect on the wallet', () => {
      expect(createDeltas({ walletId: W1, type: 'EXPENSE', amount: 50, status: 'COMPLETED' })).toEqual([
        { walletId: W1, delta: -50 },
      ]);
    });

    it('returns no delta for a pending transaction', () => {
      expect(createDeltas({ walletId: W1, type: 'INCOME', amount: 50, status: 'PENDING' })).toEqual(
        [],
      );
    });
  });

  describe('updateDeltas', () => {
    const base: BalanceState = { walletId: W1, type: 'EXPENSE', amount: 100, status: 'COMPLETED' };

    it('applies the difference when amount changes on the same wallet', () => {
      const next: BalanceState = { ...base, amount: 150 };
      // old -100, new -150 => delta -50
      expect(updateDeltas(base, next)).toEqual([{ walletId: W1, delta: -50 }]);
    });

    it('reverses and re-applies across wallets when the wallet changes', () => {
      const next: BalanceState = { ...base, walletId: W2 };
      expect(updateDeltas(base, next)).toEqual([
        { walletId: W1, delta: 100 },
        { walletId: W2, delta: -100 },
      ]);
    });

    it('removes the effect when a completed transaction becomes cancelled', () => {
      const next: BalanceState = { ...base, status: 'CANCELLED' };
      expect(updateDeltas(base, next)).toEqual([{ walletId: W1, delta: 100 }]);
    });

    it('adds the effect when a pending transaction becomes completed', () => {
      const prev: BalanceState = { ...base, status: 'PENDING' };
      expect(updateDeltas(prev, base)).toEqual([{ walletId: W1, delta: -100 }]);
    });

    it('returns no delta when nothing balance-relevant changes', () => {
      expect(updateDeltas(base, { ...base })).toEqual([]);
    });

    it('flips sign when type changes from expense to income', () => {
      const next: BalanceState = { ...base, type: 'INCOME' };
      // old -100, new +100 => delta +200
      expect(updateDeltas(base, next)).toEqual([{ walletId: W1, delta: 200 }]);
    });
  });

  describe('deleteDeltas', () => {
    it('reverses a completed expense', () => {
      expect(
        deleteDeltas({ walletId: W1, type: 'EXPENSE', amount: 100, status: 'COMPLETED' }),
      ).toEqual([{ walletId: W1, delta: 100 }]);
    });

    it('does nothing for a cancelled transaction', () => {
      expect(
        deleteDeltas({ walletId: W1, type: 'EXPENSE', amount: 100, status: 'CANCELLED' }),
      ).toEqual([]);
    });
  });
});
