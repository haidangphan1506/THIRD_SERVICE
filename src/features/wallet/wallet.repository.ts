import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { CreateWalletDto, UpdateWalletDto } from '@packages/entities';
import { wallets } from 'src/database/schema';
import { buildListWhereClause } from '@packages/helpers';
import { and, count, eq } from 'drizzle-orm';

@Injectable()
export class WalletRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}
  async findByField(userId: string, field: 'id' | 'name', value: string) {
    return await this.db
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets[field], value)));
  }

  async create(userId: string, createWalletDto: CreateWalletDto) {
    const { name, type, currency, categoriesId, balance, note, isDefault, isActive } =
      createWalletDto;
    const [wallet] = await this.db
      .insert(wallets)
      .values({
        userId,
        name,
        type,
        currency,
        balance: balance.toString(),
        categoriesId: categoriesId ?? [],
        note: note ?? '',
        isDefault,
        isActive,
      })
      .returning();
    return wallet;
  }

  async getWallets({
    page = 1,
    limit = 10,
    search,
    searchableColumns,
    filters,
    filterColumns,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    searchableColumns?: Record<string, any>;
    filters?: Record<string, any>;
    filterColumns?: Record<string, any>;
  }) {
    const whereClause = buildListWhereClause({
      search,
      searchableColumns,
      filters,
      filterColumns,
    });

    const [totalRow] = await this.db.select({ total: count() }).from(wallets).where(whereClause);
    const total = Number(totalRow?.total ?? 0);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const categoryRows = await this.db
      .select()
      .from(wallets)
      .where(whereClause)
      .limit(limitNumber)
      .offset(offset);
    return {
      wallets: categoryRows,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async updateWalet({ id, updateWalletDto }: { id: string; updateWalletDto: UpdateWalletDto }) {
    const { balance, ...rest } = updateWalletDto;
    const wallet = await this.db
      .update(wallets)
      .set({
        ...rest,
        ...(balance !== undefined && { balance: balance.toString() }),
      })
      .where(eq(wallets.id, id))
      .returning();

    return wallet || null;
  }

  async deleteWallet({ id }: { id: string }) {
    const wallet = await this.db.delete(wallets).where(eq(wallets.id, id)).returning();
    return wallet.length > 0;
  }
}
