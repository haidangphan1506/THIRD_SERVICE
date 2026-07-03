import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  sql,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from 'drizzle-orm';
import {
  type CreateTransactionDto,
  type GetTransactionsQueryDto,
  type UpdateTransactionDto,
} from '@packages/entities/transactions';
import { transactions, wallets } from 'src/database/schema';
import { createDeltas, deleteDeltas, updateDeltas } from './transaction.balance';

type TransactionRow = InferSelectModel<typeof transactions>;
type DbOrTx =
  | ReturnType<typeof drizzle>
  | Parameters<Parameters<ReturnType<typeof drizzle>['transaction']>[0]>[0];

@Injectable()
export class TransactionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  private async applyBalanceDeltas(
    tx: DbOrTx,
    deltas: { walletId: string; delta: number }[],
  ): Promise<void> {
    for (const { walletId, delta } of deltas) {
      if (delta === 0) continue;
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${delta.toFixed(2)}`, updatedAt: new Date() })
        .where(eq(wallets.id, walletId));
    }
  }

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<TransactionRow> {
    const { name, userId, walletId, categoryId, amount, note, type } = createTransactionDto;
    if (userId === undefined) {
      throw new Error('userId is required to create a transaction');
    }
    const status = createTransactionDto.status ?? 'COMPLETED';

    return this.db.transaction(async (tx) => {
      const [transaction] = await tx
        .insert(transactions)
        .values({
          name,
          userId,
          walletId,
          categoryId,
          amount: amount.toFixed(2),
          note,
          type,
          status,
        })
        .returning();

      await this.applyBalanceDeltas(tx, createDeltas({ walletId, type, amount, status }));
      return transaction;
    });
  }

  async getTransactionsByUserId({
    userId,
    page = 1,
    limit = 10,
    search,
    walletId,
    categoryId,
    type,
    status,
    from,
    to,
  }: GetTransactionsQueryDto & { userId: string }): Promise<{
    data: TransactionRow[];
    total: number;
  }> {
    const conditions: SQL[] = [eq(transactions.userId, userId)];
    if (search?.trim()) conditions.push(ilike(transactions.name, `%${search.trim()}%`));
    if (walletId) conditions.push(eq(transactions.walletId, walletId));
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
    if (type) conditions.push(eq(transactions.type, type));
    if (status) conditions.push(eq(transactions.status, status));
    if (from) conditions.push(gte(transactions.createdAt, from));
    if (to) conditions.push(lte(transactions.createdAt, to));

    const whereClause = and(...conditions);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(transactions)
      .where(whereClause);
    const total = Number(totalRow?.total ?? 0);

    const data = await this.db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limitNumber)
      .offset(offset);

    return { data, total };
  }

  async getTransactionById({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<TransactionRow | null> {
    const [transaction] = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);
    return transaction ?? null;
  }

  async updateTransactionById({
    userId,
    id,
    updateTransactionDto,
    existing,
  }: {
    userId: string;
    id: string;
    updateTransactionDto: UpdateTransactionDto;
    existing: TransactionRow;
  }): Promise<TransactionRow | null> {
    const updateData: Partial<InferInsertModel<typeof transactions>> = { updatedAt: new Date() };
    if (updateTransactionDto.name !== undefined) updateData.name = updateTransactionDto.name;
    if (updateTransactionDto.walletId !== undefined)
      updateData.walletId = updateTransactionDto.walletId;
    if (updateTransactionDto.categoryId !== undefined)
      updateData.categoryId = updateTransactionDto.categoryId;
    if (updateTransactionDto.amount !== undefined)
      updateData.amount = updateTransactionDto.amount.toFixed(2);
    if (updateTransactionDto.note !== undefined) updateData.note = updateTransactionDto.note;
    if (updateTransactionDto.type !== undefined) updateData.type = updateTransactionDto.type;
    if (updateTransactionDto.status !== undefined) updateData.status = updateTransactionDto.status;

    // Old vs new balance effect (handles wallet/amount/type/status changes).
    const deltas = updateDeltas(
      {
        walletId: existing.walletId,
        type: existing.type,
        amount: Number(existing.amount),
        status: existing.status,
      },
      {
        walletId: updateTransactionDto.walletId ?? existing.walletId,
        type: updateTransactionDto.type ?? existing.type,
        amount: updateTransactionDto.amount ?? Number(existing.amount),
        status: updateTransactionDto.status ?? existing.status,
      },
    );

    return this.db.transaction(async (tx) => {
      const [transaction] = await tx
        .update(transactions)
        .set(updateData)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning();

      if (!transaction) return null;

      await this.applyBalanceDeltas(tx, deltas);
      return transaction;
    });
  }

  async deleteTransactionById({
    userId,
    id,
    existing,
  }: {
    userId: string;
    id: string;
    existing: TransactionRow;
  }): Promise<boolean> {
    const deltas = deleteDeltas({
      walletId: existing.walletId,
      type: existing.type,
      amount: Number(existing.amount),
      status: existing.status,
    });

    return this.db.transaction(async (tx) => {
      const deleted = await tx
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning();

      if (deleted.length === 0) return false;

      // Reverse the balance effect of the removed transaction.
      await this.applyBalanceDeltas(tx, deltas);
      return true;
    });
  }
}
