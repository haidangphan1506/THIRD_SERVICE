import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, count, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { wallets } from 'src/database/schema';
import { type CreateWalletDto } from '@packages/entities/wallet/wallet.dto';
import { buildListWhereClause } from '@packages/helpers';

@Injectable()
export class WalletRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async createWallet(
    createWalletDto: CreateWalletDto & { userId: string },
  ): Promise<InferSelectModel<typeof wallets>> {
    const [wallet] = await this.db
      .insert(wallets)
      .values({
        ...createWalletDto,
        userId: createWalletDto.userId,
        balance: createWalletDto.balance.toString(),
        isDefault: createWalletDto.isDefault ?? false,
        isActive: createWalletDto.isActive ?? true,
      })
      .returning();
    return wallet;
  }

  async getWalletsByUserId({
    userId,
    page = 1,
    limit = 10,
    search,
    searchableColumns,
    filters,
    filterColumns,
  }: {
    userId: string;
    page?: number;
    limit?: number;
    search?: string;
    searchableColumns?: Record<string, any>;
    filters?: Record<string, any>;
    filterColumns?: Record<string, any>;
  }): Promise<{
    wallets: InferSelectModel<typeof wallets>[];
    total: number;
  }> {
    const whereClause = buildListWhereClause({
      search,
      searchableColumns,
      filters,
      filterColumns,
    });

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(wallets)
      .where(and(whereClause, eq(wallets.userId, userId)));
    const total = Number(totalRow?.total ?? 0);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const walletRows = await this.db
      .select()
      .from(wallets)
      .where(and(whereClause, eq(wallets.userId, userId)))
      .limit(limitNumber)
      .offset(offset);
    return {
      wallets: walletRows,
      total,
    };
  }

  async updateWalletById({
    userId,
    id,
    updateWalletDto,
  }: {
    userId: string;
    id: string;
    updateWalletDto: Partial<Omit<CreateWalletDto, 'userId'>>;
  }): Promise<InferSelectModel<typeof wallets> | null> {
    const updateData: Partial<InferInsertModel<typeof wallets>> = {};
    if (updateWalletDto.name !== undefined) updateData.name = updateWalletDto.name;
    if (updateWalletDto.type !== undefined) updateData.type = updateWalletDto.type;
    if (updateWalletDto.currency !== undefined) updateData.currency = updateWalletDto.currency;
    if (updateWalletDto.categoriesId !== undefined) updateData.categoriesId = updateWalletDto.categoriesId;
    if (updateWalletDto.balance !== undefined) updateData.balance = String(updateWalletDto.balance);
    if (updateWalletDto.note !== undefined) updateData.note = updateWalletDto.note;
    if (updateWalletDto.isDefault !== undefined) updateData.isDefault = updateWalletDto.isDefault;
    if (updateWalletDto.isActive !== undefined) updateData.isActive = updateWalletDto.isActive;

    const [wallet] = await this.db
      .update(wallets)
      .set(updateData)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();
    return wallet ?? null;
  }

  async deleteWalletById({ userId, id }: { userId: string; id: string }): Promise<boolean> {
    const wallet = await this.db
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();
    return wallet.length > 0;
  }
}
