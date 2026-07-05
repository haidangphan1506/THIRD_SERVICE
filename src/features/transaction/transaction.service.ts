import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionRepository } from './transaction.repository';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { CategoryService } from '../category/category.service';
import {
  type CreateTransactionDto,
  type GetTransactionsQueryDto,
  type UpdateTransactionDto,
} from '@packages/entities/transactions';
import { ERROR_MESSAGES } from 'src/data/constants';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transaction: TransactionRepository,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly categoryService: CategoryService,
  ) {}

  private async assertUserExists(userId: string) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
    }
    const userData = await this.userService.getUserByField({ field: 'id', value: userId });
    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }

  private async assertWalletOwnedByUser(userId: string, walletId: string) {
    const wallet = await this.walletService.getWalletByFieldService({
      userId,
      field: 'id',
      value: walletId,
    });
    if (!wallet || (Array.isArray(wallet) && wallet.length === 0)) {
      throw new NotFoundException(ERROR_MESSAGES.WALLET_NOT_EXISTS);
    }
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.categoryService.getCategoryService({
      field: 'id',
      value: categoryId,
    });
    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }
  }

  async createTransactionService({
    user,
    createTransactionDto,
  }: {
    user: Record<string, string>;
    createTransactionDto: CreateTransactionDto;
  }) {
    const { id: userId } = user;
    await this.assertUserExists(userId);
    await this.assertWalletOwnedByUser(userId, createTransactionDto.walletId);
    await this.assertCategoryExists(createTransactionDto.categoryId);

    return await this.transaction.createTransaction({ ...createTransactionDto, userId });
  }

  async getTransactionsService({
    user,
    query,
  }: {
    user: Record<string, string>;
    query: GetTransactionsQueryDto;
  }) {
    const { id: userId } = user;
    await this.assertUserExists(userId);

    return await this.transaction.getTransactionsByUserId({ userId, ...query });
  }

  async getTransactionByIdService({ user, id }: { user: Record<string, string>; id: string }) {
    const { id: userId } = user;
    await this.assertUserExists(userId);

    const transaction = await this.transaction.getTransactionById({ userId, id });
    if (!transaction) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }
    return transaction;
  }

  async updateTransactionService({
    user,
    id,
    updateTransactionDto,
  }: {
    user: Record<string, string>;
    id: string;
    updateTransactionDto: UpdateTransactionDto;
  }) {
    const { id: userId } = user;
    await this.assertUserExists(userId);

    const existing = await this.transaction.getTransactionById({ userId, id });
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }

    if (updateTransactionDto.walletId) {
      await this.assertWalletOwnedByUser(userId, updateTransactionDto.walletId);
    }
    if (updateTransactionDto.categoryId) {
      await this.assertCategoryExists(updateTransactionDto.categoryId);
    }

    return await this.transaction.updateTransactionById({
      userId,
      id,
      updateTransactionDto,
      existing,
    });
  }

  async deleteTransactionService({ user, id }: { user: Record<string, string>; id: string }) {
    const { id: userId } = user;
    await this.assertUserExists(userId);

    const existing = await this.transaction.getTransactionById({ userId, id });
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }

    return await this.transaction.deleteTransactionById({ userId, id, existing });
  }
}
