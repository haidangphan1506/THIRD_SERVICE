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
import { TransactionService } from './transaction.service';
import {
  type CreateTransactionDto,
  createTransactionSchema,
  type GetTransactionsQueryDto,
  getTransactionsQuerySchema,
  type UpdateTransactionDto,
  updateTransactionSchema,
} from '@packages/entities/transactions';
import { ZodValidationPipe } from '@packages/pipes';
import { ApiResponse, CurrentUser } from '@packages/decorators';
import { SUCCESS_MESSAGES } from 'src/data/constants';

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'List transactions',
    description: 'Get a paginated list of transactions with filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by transaction name',
  })
  @ApiQuery({
    name: 'walletId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filter by wallet',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['INCOME', 'EXPENSE'],
    description: 'Filter by type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date',
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    format: 'date',
    description: 'End date (ISO 8601)',
  })
  @SwaggerResponse({ status: 200, description: 'Transactions fetched successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.TRANSACTION_FETCHED })
  async getTransactions(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<GetTransactionsQueryDto>(getTransactionsQuerySchema))
    query: GetTransactionsQueryDto,
  ) {
    return await this.transactionService.getTransactionsService({ user, query });
  }

  @Get('/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Get transaction by ID',
    description: 'Get a single transaction by its ID',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Transaction ID' })
  @SwaggerResponse({ status: 200, description: 'Transaction fetched' })
  @SwaggerResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.TRANSACTION_FETCHED })
  async getTransaction(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return await this.transactionService.getTransactionByIdService({ user, id });
  }

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Create transaction',
    description: 'Create a new transaction (updates wallet balance automatically)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'walletId', 'categoryId', 'amount', 'type'],
      properties: {
        name: { type: 'string', example: 'Grocery shopping' },
        walletId: {
          type: 'string',
          format: 'uuid',
          description: 'Wallet ID',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          description: 'Category ID',
          example: '550e8400-e29b-41d4-a716-446655440001',
        },
        amount: {
          type: 'number',
          minimum: 0,
          description: 'Must be greater than 0',
          example: 500000,
        },
        note: { type: 'string', example: 'Weekly groceries' },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'EXPENSE' },
        status: {
          type: 'string',
          enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
          default: 'COMPLETED',
        },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: SUCCESS_MESSAGES.TRANSACTION_CREATED })
  async createTransaction(
    @CurrentUser() user: Record<string, string>,
    @Body(new ZodValidationPipe<CreateTransactionDto>(createTransactionSchema))
    createTransactionDto: CreateTransactionDto,
  ) {
    return await this.transactionService.createTransactionService({ user, createTransactionDto });
  }

  @Put('/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Update transaction',
    description: 'Update a transaction (recalculates wallet balance deltas)',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Transaction ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated grocery' },
        walletId: { type: 'string', format: 'uuid' },
        categoryId: { type: 'string', format: 'uuid' },
        amount: { type: 'number', minimum: 0, description: 'Must be greater than 0' },
        note: { type: 'string' },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
        status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Transaction updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.TRANSACTION_UPDATED })
  async updateTransaction(
    @CurrentUser() user: Record<string, string>,
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateTransactionDto>(updateTransactionSchema))
    updateTransactionDto: UpdateTransactionDto,
  ) {
    return await this.transactionService.updateTransactionService({
      user,
      id,
      updateTransactionDto,
    });
  }

  @Delete('/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Delete transaction',
    description: 'Delete a transaction (reverses wallet balance effect)',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Transaction ID' })
  @SwaggerResponse({ status: 200, description: 'Transaction deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.TRANSACTION_DELETED })
  async deleteTransaction(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return await this.transactionService.deleteTransactionService({ user, id });
  }
}
