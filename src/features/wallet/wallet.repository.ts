import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { CreateWalletDto } from '@packages/entities';
import { wallets } from 'src/database/schema';
import { buildListWhereClause } from '@packages/helpers';
import { count } from 'drizzle-orm';

@Injectable()
export class WalletRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}
  async create(createWalletDto: CreateWalletDto) {
    const { userId, name, type, currency, categoriesId, balance, note, isDefault, isActive } =
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
}
