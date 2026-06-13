import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type CreateTransactionDto,
  type GetTransactionsQueryDto,
  type UpdateTransactionDto,
} from '@packages/entities/transactions';
import { UUID_V4_REGEX } from '../wallet/wallet.service';
import { TransactionRepository } from './transaction.repository';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { CategoryService } from '../category/category.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transaction: TransactionRepository,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly categoryService: CategoryService,
  ) {}

  private async assertUser(userId?: string): Promise<void> {
    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID ...');
    }
    const user = await this.userService.getUserByField({ field: 'id', value: userId });
    if (!user || !Array.isArray(user) || user.length === 0) {
      throw new BadRequestException('User not found ...');
    }
  }

  private async assertWallet(userId: string, walletId: string): Promise<void> {
    if (!walletId || !UUID_V4_REGEX.test(walletId)) {
      throw new BadRequestException('Wallet ID must be a valid UUID');
    }
    const wallet = await this.walletService.getWalletByIdService({ userId, id: walletId });
    if (!wallet) {
      throw new BadRequestException('Wallet not found ...');
    }
  }

  private async assertCategory(categoryId: string): Promise<void> {
    if (!categoryId || !UUID_V4_REGEX.test(categoryId)) {
      throw new BadRequestException('Category ID must be a valid UUID');
    }
    const category = await this.categoryService.getCategoryService({
      field: 'id',
      value: categoryId,
    });
    if (!category || !Array.isArray(category) || category.length === 0) {
      throw new BadRequestException('Category not found ...');
    }
  }

  async createTransactionService(createTransactionDto: CreateTransactionDto) {
    const { userId, walletId, categoryId } = createTransactionDto;
    await this.assertUser(userId);
    await this.assertWallet(userId as string, walletId);
    await this.assertCategory(categoryId);
    return this.transaction.createTransaction(createTransactionDto);
  }

  async getTransactionsService({
    userId,
    ...query
  }: GetTransactionsQueryDto & { userId: string }) {
    await this.assertUser(userId);
    const { data, total } = await this.transaction.getTransactionsByUserId({ userId, ...query });
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionByIdService({ userId, id }: { userId: string; id: string }) {
    await this.assertUser(userId);
    const transaction = await this.transaction.getTransactionById({ userId, id });
    if (!transaction) {
      throw new NotFoundException('Transaction not found ...');
    }
    return transaction;
  }

  async updateTransactionService({
    userId,
    id,
    updateTransactionDto,
  }: {
    userId: string;
    id: string;
    updateTransactionDto: UpdateTransactionDto;
  }) {
    await this.assertUser(userId);
    const existing = await this.transaction.getTransactionById({ userId, id });
    if (!existing) {
      throw new NotFoundException('Transaction not found ...');
    }
    if (updateTransactionDto.walletId) {
      await this.assertWallet(userId, updateTransactionDto.walletId);
    }
    if (updateTransactionDto.categoryId) {
      await this.assertCategory(updateTransactionDto.categoryId);
    }
    const updated = await this.transaction.updateTransactionById({
      userId,
      id,
      updateTransactionDto,
      existing,
    });
    if (!updated) {
      throw new NotFoundException('Transaction not found ...');
    }
    return updated;
  }

  async deleteTransactionService({ userId, id }: { userId: string; id: string }) {
    await this.assertUser(userId);
    const existing = await this.transaction.getTransactionById({ userId, id });
    if (!existing) {
      throw new NotFoundException('Transaction not found ...');
    }
    return this.transaction.deleteTransactionById({ userId, id, existing });
  }
}
