import { Body, Controller, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiResponse } from '@packages/decorators';
import { StatusCodes } from 'http-status-codes';
import {
  type CreateTransactionDto,
  createTransactionSchema,
} from '@packages/entities/transactions';
import { ZodValidationPipe } from '@packages/pipes';
import { CurrentUser } from '@packages/decorators';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('')
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Transaction created successfully' })
  async createTransactionController(
    @CurrentUser() user: Record<string, string>,
    @Body(new ZodValidationPipe<CreateTransactionDto>(createTransactionSchema))
    createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.createTransactionService({
      ...createTransactionDto,
      userId: user.id,
    });
  }
}
