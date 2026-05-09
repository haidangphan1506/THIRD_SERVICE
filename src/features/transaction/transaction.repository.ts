import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { type CreateTransactionDto } from '@packages/entities/transactions';
import { transactions } from 'src/database/schema';

@Injectable()
export class TransactionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto) {
    const { name, userId, walletId, categoryId, amount, note, type, status } =
      createTransactionDto;
    if (userId === undefined) {
      throw new Error('userId is required to create a transaction');
    }
    const transaction = await this.db
      .insert(transactions)
      .values({
        name,
        userId,
        walletId,
        categoryId,
        amount: amount.toFixed(2),
        note,
        type,
        status: status ?? 'COMPLETED',
      })
      .returning();
    return transaction[0];
  }
}
