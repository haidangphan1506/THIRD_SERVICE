import { Controller, Get, Query } from '@nestjs/common';
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

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Report summary fetched successfully' })
  async getSummary(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<ReportRangeDto>(reportRangeSchema)) query: ReportRangeDto,
  ) {
    return this.reportService.getSummaryService(user.id, query);
  }

  @Get('by-category')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Report by category fetched successfully' })
  async getByCategory(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<ReportByCategoryDto>(reportByCategorySchema))
    query: ReportByCategoryDto,
  ) {
    return this.reportService.getByCategoryService(user.id, query);
  }

  @Get('trend')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Report trend fetched successfully' })
  async getTrend(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<ReportTrendDto>(reportTrendSchema)) query: ReportTrendDto,
  ) {
    return this.reportService.getTrendService(user.id, query);
  }

  @Get('by-wallet')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Report by wallet fetched successfully' })
  async getByWallet(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<ReportRangeDto>(reportRangeSchema)) query: ReportRangeDto,
  ) {
    return this.reportService.getByWalletService(user.id, query);
  }
}
