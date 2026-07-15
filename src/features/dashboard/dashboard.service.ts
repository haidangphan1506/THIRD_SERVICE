import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { checkUuidValid } from '@packages/helpers';
import {
  DashboardRepository,
  type MonthlyRow,
  type TodayScheduleRow,
} from './dashboard.repository';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';

export interface DashboardOverview {
  role: string;
  stats: {
    classesCount: number;
    studentsCount: number;
    sessionsThisWeek: number;
    sessionsCompletedThisWeek: number;
    revenueThisMonth: number;
    overdueTuitionCount: number;
    unpaidTuitionAmount: number;
  };
  todaySchedule: TodayScheduleRow[];
  monthly: MonthlyRow[];
  recentNotifications: unknown[];
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly repo: DashboardRepository,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  private startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private endOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  // Monday as the first day of the week
  private startOfWeek(d: Date) {
    const x = this.startOfDay(d);
    const day = (x.getDay() + 6) % 7; // 0 = Monday
    x.setDate(x.getDate() - day);
    return x;
  }

  async getOverview(userId: string): Promise<DashboardOverview> {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');

    const users = await this.userService.getUserByField({ field: 'id', value: userId });
    const user = Array.isArray(users) ? users[0] : users;
    if (!user) throw new NotFoundException('User not found ...');

    const role = user.role ?? 'STUDENT';
    const isStudent = role === 'STUDENT';

    const classIds = isStudent
      ? await this.repo.getStudentClassIds(userId)
      : await this.repo.getTutorClassIds(userId);

    const now = new Date();
    const weekStart = this.startOfWeek(now);
    const weekEnd = this.endOfDay(new Date(weekStart.getTime() + 6 * 86_400_000));
    const dayStart = this.startOfDay(now);
    const dayEnd = this.endOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const year = now.getFullYear();

    const [
      studentsCount,
      sessionStats,
      todaySchedule,
      revenueThisMonth,
      monthlyRevenue,
      monthlySessions,
    ] = await Promise.all([
      isStudent ? Promise.resolve(0) : this.repo.countStudents(classIds),
      this.repo.getSessionStats(classIds, weekStart, weekEnd),
      this.repo.getSchedule(classIds, dayStart, dayEnd),
      isStudent ? Promise.resolve(0) : this.repo.getRevenue(classIds, monthStart, monthEnd),
      this.repo.getMonthlyRevenue(classIds, year),
      this.repo.getMonthlySessions(classIds, year),
    ]);

    const overdue = await this.repo.getTuitionSum(
      classIds,
      'OVERDUE',
      isStudent ? userId : undefined,
    );
    const unpaid = await this.repo.getTuitionSum(
      classIds,
      'UNPAID',
      isStudent ? userId : undefined,
    );
    const unpaidTuitionAmount = isStudent ? unpaid.total + overdue.total : unpaid.total;

    const monthly: MonthlyRow[] = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return {
        month: m,
        revenue: monthlyRevenue.get(m) ?? 0,
        sessions: monthlySessions.get(m) ?? 0,
      };
    });

    const notifications = await this.notificationService.findAll(userId, {});
    const recentNotifications = Array.isArray(notifications) ? notifications.slice(0, 5) : [];

    return {
      role,
      stats: {
        classesCount: classIds.length,
        studentsCount,
        sessionsThisWeek: sessionStats.total,
        sessionsCompletedThisWeek: sessionStats.completed,
        revenueThisMonth,
        overdueTuitionCount: overdue.count,
        unpaidTuitionAmount,
      },
      todaySchedule,
      monthly,
      recentNotifications,
    };
  }
}
