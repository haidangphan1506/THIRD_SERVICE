import { StatusCodes } from 'http-status-codes';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiResponse } from '@nestjs/swagger';
import {
  type CreateWalletDto,
  updateWalletSchema,
} from '@packages/entities/wallet/wallet.dto';
import { ZodValidationPipe } from '@packages/pipes';
import { createWalletSchema } from '@packages/entities/wallet/wallet.schema';
import { CurrentUser } from '@packages/decorators';
import { wallets } from 'src/database/schema';
import { InferSelectModel } from 'drizzle-orm';

type WalletUpdateInput = Partial<Omit<CreateWalletDto, 'userId'>>;

@Controller('wallets')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiResponse({ status: StatusCodes.CREATED, description: 'Create wallet successfully ...' })
  async createWalletController(
    @CurrentUser() user: Record<string, string>,
    @Body(new ZodValidationPipe<CreateWalletDto>(createWalletSchema))
    createWalletDto: CreateWalletDto,
  ): Promise<InferSelectModel<typeof wallets>> {
    this.logger.log(`Creating wallet with userId : ${user.id}`);
    return await this.walletService.createWalletService({
      ...createWalletDto,
      userId: user.id,
    });
  }

  @Get()
  async getWalletsController(
    @CurrentUser() user: Record<string, string>,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    data: InferSelectModel<typeof wallets>[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.walletService.getWalletsService({ userId: user.id, page, limit });
  }

  @Get('/:id')
  @ApiResponse({ status: StatusCodes.OK, description: 'Get wallet by id successfully ...' })
  async getWalletByIdController(
    @CurrentUser() user: Record<string, string>,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<InferSelectModel<typeof wallets>> {
    const wallet = await this.walletService.getWalletByIdService({ userId: user.id, id });
    return wallet;
  }

  @Put('/:id')
  @ApiResponse({ status: StatusCodes.OK, description: 'Update wallet successfully ...' })
  async updateWalletController(
    @CurrentUser() user: Record<string, string>,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe<WalletUpdateInput>(updateWalletSchema))
    updateWalletDto: WalletUpdateInput,
  ): Promise<InferSelectModel<typeof wallets>> {
    return this.walletService.updateWalletService({
      userId: user.id,
      id,
      updateWalletDto,
    });
  }

  @Delete('/:id')
  @ApiResponse({ status: StatusCodes.OK, description: 'Delete wallet successfully ...' })
  async deleteWalletController(
    @CurrentUser() user: Record<string, string>,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<boolean> {
    return this.walletService.deleteWalletService({ userId: user.id, id });
  }
}
