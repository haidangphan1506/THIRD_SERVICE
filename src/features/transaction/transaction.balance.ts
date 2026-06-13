/**
 * Pure balance math for transactions, extracted so it can be unit-tested
 * without a database. A transaction only moves a wallet balance when it is
 * COMPLETED: INCOME adds, EXPENSE subtracts.
 */

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface BalanceState {
  walletId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
}

/** Signed effect of a single transaction on its wallet balance. */
export function balanceEffect(
  type: TransactionType,
  amount: number,
  status: TransactionStatus,
): number {
  if (status !== 'COMPLETED') return 0;
  return type === 'INCOME' ? amount : -amount;
}

/** Delta to apply when a brand-new transaction is created. */
export function createDeltas(next: BalanceState): { walletId: string; delta: number }[] {
  const delta = balanceEffect(next.type, next.amount, next.status);
  return delta === 0 ? [] : [{ walletId: next.walletId, delta }];
}

/**
 * Deltas to apply when an existing transaction changes. Handles amount/type/
 * status edits as well as moving the transaction to a different wallet.
 */
export function updateDeltas(
  prev: BalanceState,
  next: BalanceState,
): { walletId: string; delta: number }[] {
  const prevEffect = balanceEffect(prev.type, prev.amount, prev.status);
  const nextEffect = balanceEffect(next.type, next.amount, next.status);

  if (prev.walletId === next.walletId) {
    const delta = nextEffect - prevEffect;
    return delta === 0 ? [] : [{ walletId: prev.walletId, delta }];
  }

  const result: { walletId: string; delta: number }[] = [];
  if (prevEffect !== 0) result.push({ walletId: prev.walletId, delta: -prevEffect });
  if (nextEffect !== 0) result.push({ walletId: next.walletId, delta: nextEffect });
  return result;
}

/** Delta to apply when a transaction is deleted (reverse its effect). */
export function deleteDeltas(prev: BalanceState): { walletId: string; delta: number }[] {
  const effect = balanceEffect(prev.type, prev.amount, prev.status);
  return effect === 0 ? [] : [{ walletId: prev.walletId, delta: -effect }];
}
