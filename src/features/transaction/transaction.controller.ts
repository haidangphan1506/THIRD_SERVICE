import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
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

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @HttpCode(StatusCodes.OK)
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
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.TRANSACTION_FETCHED })
  async getTransaction(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return await this.transactionService.getTransactionByIdService({ user, id });
  }

  @Post()
  @HttpCode(StatusCodes.CREATED)
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
  @ApiResponse({ statusCode: StatusCodes.OK, message: SUCCESS_MESSAGES.TRANSACTION_DELETED })
  async deleteTransaction(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return await this.transactionService.deleteTransactionService({ user, id });
  }
}
