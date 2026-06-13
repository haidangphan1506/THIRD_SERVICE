import { z } from 'zod';
import { reportByCategorySchema, reportRangeSchema, reportTrendSchema } from './report.schema';

export type ReportRangeDto = z.infer<typeof reportRangeSchema>;
export type ReportByCategoryDto = z.infer<typeof reportByCategorySchema>;
export type ReportTrendDto = z.infer<typeof reportTrendSchema>;

export type ReportSummary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
};

export type ReportByCategoryItem = {
  categoryId: string;
  name: string;
  color: string | null;
  icon: string | null;
  type: 'INCOME' | 'EXPENSE';
  total: number;
};

export type ReportTrendItem = {
  period: string;
  income: number;
  expense: number;
};

export type ReportByWalletItem = {
  walletId: string;
  name: string;
  income: number;
  expense: number;
  net: number;
};
