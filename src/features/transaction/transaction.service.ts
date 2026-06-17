import { Injectable } from '@nestjs/common';
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
}
