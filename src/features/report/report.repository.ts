import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { categories, transactions, wallets } from 'src/database/schema';
import {
  type ReportByCategoryDto,
  type ReportByCategoryItem,
  type ReportByWalletItem,
  type ReportRangeDto,
  type ReportSummary,
  type ReportTrendDto,
  type ReportTrendItem,
} from '@packages/entities/report';

@Injectable()
export class ReportRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  /** Only COMPLETED transactions count toward reports. */
  private baseConditions(userId: string, from?: Date, to?: Date): SQL[] {
    const conditions: SQL[] = [
      eq(transactions.userId, userId),
      eq(transactions.status, 'COMPLETED'),
    ];
    if (from) conditions.push(gte(transactions.createdAt, from));
    if (to) conditions.push(lte(transactions.createdAt, to));
    return conditions;
  }

  async getSummary(userId: string, { from, to }: ReportRangeDto): Promise<ReportSummary> {
    const [row] = await this.db
      .select({
        income: sql<string>`coalesce(sum(case when ${transactions.type} = 'INCOME' then ${transactions.amount} else 0 end), 0)`,
        expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions)
      .where(and(...this.baseConditions(userId, from, to)));

    const totalIncome = Number(row?.income ?? 0);
    const totalExpense = Number(row?.expense ?? 0);
    return { totalIncome, totalExpense, net: totalIncome - totalExpense };
  }

  async getByCategory(
    userId: string,
    { from, to, type }: ReportByCategoryDto,
  ): Promise<ReportByCategoryItem[]> {
    const conditions = this.baseConditions(userId, from, to);
    if (type) conditions.push(eq(transactions.type, type));

    const rows = await this.db
      .select({
        categoryId: categories.id,
        name: categories.name,
        color: categories.color,
        icon: categories.icon,
        type: transactions.type,
        total: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(categories.id, categories.name, categories.color, categories.icon, transactions.type)
      .orderBy(sql`sum(${transactions.amount}) desc`);

    return rows.map((r) => ({ ...r, total: Number(r.total) }));
  }

  async getTrend(
    userId: string,
    { from, to, granularity }: ReportTrendDto,
  ): Promise<ReportTrendItem[]> {
    const unit = granularity ?? 'month';
    const periodExpr = sql<string>`to_char(date_trunc(${unit}, ${transactions.createdAt}), 'YYYY-MM-DD')`;

    const rows = await this.db
      .select({
        period: periodExpr,
        income: sql<string>`coalesce(sum(case when ${transactions.type} = 'INCOME' then ${transactions.amount} else 0 end), 0)`,
        expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions)
      .where(and(...this.baseConditions(userId, from, to)))
      .groupBy(periodExpr)
      .orderBy(periodExpr);

    return rows.map((r) => ({
      period: r.period,
      income: Number(r.income),
      expense: Number(r.expense),
    }));
  }

  async getByWallet(userId: string, { from, to }: ReportRangeDto): Promise<ReportByWalletItem[]> {
    const rows = await this.db
      .select({
        walletId: wallets.id,
        name: wallets.name,
        income: sql<string>`coalesce(sum(case when ${transactions.type} = 'INCOME' then ${transactions.amount} else 0 end), 0)`,
        expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions)
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .where(and(...this.baseConditions(userId, from, to)))
      .groupBy(wallets.id, wallets.name)
      .orderBy(wallets.name);

    return rows.map((r) => {
      const income = Number(r.income);
      const expense = Number(r.expense);
      return { walletId: r.walletId, name: r.name, income, expense, net: income - expense };
    });
  }
}
