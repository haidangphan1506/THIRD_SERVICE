import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { ReportService } from './report.service';
import { ApiResponse, CurrentUser } from '@packages/decorators';
import { ZodValidationPipe } from '@packages/pipes';
import {
  type ReportByCategoryDto,
  type ReportRangeDto,
  type ReportTrendDto,
  reportByCategorySchema,
  reportRangeSchema,
  reportTrendSchema,
} from '@packages/entities/report';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Report summary',
    description: 'Get total income, expense, and net balance over a date range',
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
  @SwaggerResponse({ status: 200, description: 'Report summary fetched' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Report summary fetched successfully' })
  async getSummary(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<ReportRangeDto>(reportRangeSchema)) query: ReportRangeDto,
  ) {
    return this.reportService.getSummaryService(user.id, query);
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Report by category',
    description: 'Get aggregated income/expense grouped by category',
  })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['INCOME', 'EXPENSE'],
    description: 'Filter by transaction type',
  })
  @SwaggerResponse({ status: 200, description: 'Report by category fetched' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Report by category fetched successfully' })
  async getByCategory(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<ReportByCategoryDto>(reportByCategorySchema))
    query: ReportByCategoryDto,
  ) {
    return this.reportService.getByCategoryService(user.id, query);
  }

  @Get('trend')
  @ApiOperation({
    summary: 'Report trend',
    description: 'Get time-series income/expense by day, week, or month',
  })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date' })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['day', 'week', 'month'],
    default: 'month',
    description: 'Time granularity',
  })
  @SwaggerResponse({ status: 200, description: 'Report trend fetched' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Report trend fetched successfully' })
  async getTrend(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<ReportTrendDto>(reportTrendSchema)) query: ReportTrendDto,
  ) {
    return this.reportService.getTrendService(user.id, query);
  }

  @Get('by-wallet')
  @ApiOperation({
    summary: 'Report by wallet',
    description: 'Get aggregated income/expense grouped by wallet',
  })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date' })
  @SwaggerResponse({ status: 200, description: 'Report by wallet fetched' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Report by wallet fetched successfully' })
  async getByWallet(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<ReportRangeDto>(reportRangeSchema)) query: ReportRangeDto,
  ) {
    return this.reportService.getByWalletService(user.id, query);
  }
}
