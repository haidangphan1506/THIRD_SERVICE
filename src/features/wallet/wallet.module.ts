import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { UserService } from '../user/user.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletRepository, UserService],
  exports: [WalletService],
})
export class WalletModule {}
