import { BadRequestException, Injectable } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { checkUuidValid } from '@packages/helpers';
import {
  type ReportByCategoryDto,
  type ReportRangeDto,
  type ReportTrendDto,
} from '@packages/entities/report';

@Injectable()
export class ReportService {
  constructor(private readonly report: ReportRepository) {}

  private assertUserId(userId: string): void {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException('User ID must be a valid UUID');
    }
  }

  async getSummaryService(userId: string, range: ReportRangeDto) {
    this.assertUserId(userId);
    return this.report.getSummary(userId, range);
  }

  async getByCategoryService(userId: string, query: ReportByCategoryDto) {
    this.assertUserId(userId);
    return this.report.getByCategory(userId, query);
  }

  async getTrendService(userId: string, query: ReportTrendDto) {
    this.assertUserId(userId);
    return this.report.getTrend(userId, query);
  }

  async getByWalletService(userId: string, range: ReportRangeDto) {
    this.assertUserId(userId);
    return this.report.getByWallet(userId, range);
  }
}
