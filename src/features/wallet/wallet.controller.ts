import { Controller, Get, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { type GetWalleDtotQueryDto, getWalletsQuerySchema } from '@packages/entities';
import { ZodValidationPipe } from '@packages/pipes';
import { CurrentUser } from '@packages/decorators';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWalletController(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<GetWalleDtotQueryDto>(getWalletsQuerySchema))
    query: GetWalleDtotQueryDto,
  ) {
    return await this.walletService.getWallets({ user, query });
  }
}
