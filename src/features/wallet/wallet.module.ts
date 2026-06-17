import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { UserService } from '../user/user.service';
import { CategoryModule } from '../category/category.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [CategoryModule, UserModule],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository, UserService],
  exports: [WalletService],
})
export class WalletModule {}
