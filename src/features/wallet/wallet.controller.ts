import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('Wallets')
@ApiBearerAuth('access-token')
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'List wallets',
    description: 'Get a paginated list of wallets for the current user',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Alias for limit' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by wallet name' })
  @SwaggerResponse({ status: 200, description: 'Wallets fetched successfully' })
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
  @ApiOperation({
    summary: 'Create wallet',
    description: 'Create a new wallet for the current user',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 25, example: 'Main Wallet' },
        type: {
          type: 'string',
          enum: ['CASH', 'BANK', 'E_WALLET', 'CREDIT'],
          default: 'CASH',
          example: 'BANK',
        },
        currency: { type: 'string', minLength: 3, maxLength: 3, default: 'VND', example: 'USD' },
        categoriesId: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          default: [],
          example: [],
        },
        balance: { type: 'number', minimum: 0, default: 0, example: 1000000 },
        note: { type: 'string', default: '', example: 'Savings account' },
        isDefault: { type: 'boolean', default: true, example: false },
        isActive: { type: 'boolean', default: true, example: true },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Wallet created successfully' })
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
  @ApiOperation({ summary: 'Update wallet', description: 'Update a wallet by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Wallet ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 25 },
        type: { type: 'string', enum: ['CASH', 'BANK', 'E_WALLET', 'CREDIT'] },
        currency: { type: 'string', minLength: 3, maxLength: 3 },
        categoriesId: { type: 'array', items: { type: 'string', format: 'uuid' } },
        balance: { type: 'number', minimum: 0 },
        note: { type: 'string' },
        isDefault: { type: 'boolean' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Wallet updated' })
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
  @ApiOperation({ summary: 'Delete wallet', description: 'Delete a wallet by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Wallet ID' })
  @SwaggerResponse({ status: 200, description: 'Wallet deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.WALLET_DELETED })
  async deleteWallet(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return await this.walletService.deleteWalletService({ user, id });
  }
}
