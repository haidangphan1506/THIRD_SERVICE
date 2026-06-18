import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { StatusCodes } from 'http-status-codes';
import { WalletService } from './wallet.service';
import {
  type CreateWalletDto,
  createWalletSchema,
  type GetWalleDtotQueryDto,
  getWalletsQuerySchema,
  type UpdateWalletDto,
  updateWalletSchema,
} from '@packages/entities';
import { ZodValidationPipe } from '@packages/pipes';
import { ApiResponse, CurrentUser } from '@packages/decorators';
import { SUCCESS_MESSAGES } from 'src/data/constants';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.WALLET_FETCHED })
  async getWalletController(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<GetWalleDtotQueryDto>(getWalletsQuerySchema))
    query: GetWalleDtotQueryDto,
  ) {
    return await this.walletService.getWalletsService({ user, query: query ?? {} });
  }

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: SUCCESS_MESSAGES.WALLET_CREATED })
  async createWallet(
    @CurrentUser() user: Record<string, string>,
    @Body(new ZodValidationPipe<CreateWalletDto>(createWalletSchema))
    createWalletDto: CreateWalletDto,
  ) {
    return await this.walletService.createWallet({ user, createWalletDto });
  }

  @Put('/:id')
  @HttpCode(StatusCodes.CREATED)
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: SUCCESS_MESSAGES.WALLET_CREATED })
  async updateWallet(
    @CurrentUser() user: Record<string, string>,
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateWalletDto>(updateWalletSchema))
    updateWalletDto: UpdateWalletDto,
  ) {
    return await this.walletService.updateWalletService({ user, id, updateWalletDto });
  }

  @Delete('/:id')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.WALLET_DELETED })
  async deleteWallet(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return await this.walletService.deleteWalletService({ user, id });
  }
}
