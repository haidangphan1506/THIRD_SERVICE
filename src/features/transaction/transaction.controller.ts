import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiResponse, CurrentUser } from '@packages/decorators';
import { StatusCodes } from 'http-status-codes';
import {
  type CreateTransactionDto,
  type GetTransactionsQueryDto,
  type UpdateTransactionDto,
  createTransactionSchema,
  getTransactionsQuerySchema,
  updateTransactionSchema,
} from '@packages/entities/transactions';
import { ZodValidationPipe } from '@packages/pipes';

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

  @Get('')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Transactions fetched successfully' })
  async getTransactionsController(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<GetTransactionsQueryDto>(getTransactionsQuerySchema))
    query: GetTransactionsQueryDto,
  ) {
    return this.transactionService.getTransactionsService({ userId: user.id, ...query });
  }

  @Get('/:id')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Transaction fetched successfully' })
  async getTransactionByIdController(
    @CurrentUser() user: Record<string, string>,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.transactionService.getTransactionByIdService({ userId: user.id, id });
  }

  @Put('/:id')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Transaction updated successfully' })
  async updateTransactionController(
    @CurrentUser() user: Record<string, string>,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe<UpdateTransactionDto>(updateTransactionSchema))
    updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.updateTransactionService({
      userId: user.id,
      id,
      updateTransactionDto,
    });
  }

  @Delete('/:id')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Transaction deleted successfully' })
  async deleteTransactionController(
    @CurrentUser() user: Record<string, string>,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.transactionService.deleteTransactionService({ userId: user.id, id });
  }
}
