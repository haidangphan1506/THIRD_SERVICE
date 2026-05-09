import { BadRequestException, Injectable } from '@nestjs/common';
import { type CreateTransactionDto } from '@packages/entities/transactions';
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

  async createTransactionService(createTransactionDto: CreateTransactionDto) {
    const { userId, walletId, categoryId } = createTransactionDto;

    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID ...');
    }
    const user = await this.userService.getUserByField({ field: 'id', value: userId });
    if (!user || !Array.isArray(user) || user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    if (!walletId || !UUID_V4_REGEX.test(walletId)) {
      throw new BadRequestException('Wallet ID must be a valid UUID');
    }
    const wallet = await this.walletService.getWalletByIdService({
      userId,
      id: walletId,
    });
    if (!wallet) {
      throw new BadRequestException('Wallet not found ...');
    }

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
    return await this.transaction.createTransaction(createTransactionDto);
  }
}
