import { Inject, Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import { classStudents, classes, users } from 'src/database/schema';
import type { AiScope, AiUserContext } from '../interfaces/ai-context.interface';
import type { AiToolDeclaration } from '../providers/ai-provider.interface';
import { ClassContextService } from './class.context';
import { ScheduleContextService } from './schedule.context';
import { SessionContextService } from './session.context';
import { ExerciseContextService } from './exercise.context';
import type { SessionPeriod } from '../utils/date-range';

/**
 * Aggregates all read-only context tools the AI may call. Resolves the caller's
 * scope (which classes/students they may see) once per request, exposes the tool
 * declarations for the model, and dispatches tool calls to the right context service.
 *
 * Scoping is derived from the JWT (`AiUserContext`), never from the model — the
 * model can only ever reach the current user's own data.
 */
@Injectable()
export class ContextService {
  constructor(
    @Inject('DRIZZLE')
    private readonly db: ReturnType<typeof drizzle>,
    private readonly classCtx: ClassContextService,
    private readonly scheduleCtx: ScheduleContextService,
    private readonly sessionCtx: SessionContextService,
    private readonly exerciseCtx: ExerciseContextService,
  ) {}

  /** Tool declarations advertised to the model provider. */
  getToolDeclarations(): AiToolDeclaration[] {
    const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    return [
      {
        name: 'getMyClasses',
        description:
          'Danh sách các lớp học mà người dùng đang dạy (TUTOR) hoặc đang theo học (STUDENT/PARENT). Dùng khi hỏi về lớp học, môn học, học phí của lớp, trạng thái lớp.',
        parametersJsonSchema: { type: 'object', properties: {} },
      },
      {
        name: 'getMyCurriculums',
        description:
          'Danh sách chương trình học / giáo trình mà người dùng đã tạo, kèm số chương và số bài học. Dùng khi hỏi "tôi có bao nhiêu chương trình học", "giáo trình của tôi".',
        parametersJsonSchema: { type: 'object', properties: {} },
      },
      {
        name: 'getMySchedule',
        description:
          'Thời khóa biểu định kỳ hàng tuần của người dùng. Dùng khi hỏi về lịch học theo thứ trong tuần.',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            dayOfWeek: {
              type: 'string',
              enum: WEEKDAYS,
              description: 'Lọc theo thứ trong tuần (tùy chọn).',
            },
          },
        },
      },
      {
        name: 'getUpcomingSessions',
        description:
          'Các buổi học cụ thể theo ngày giờ trong một khoảng thời gian. Trả về cả "count" (số buổi) — dùng đúng số này khi trả lời, không tự đếm hay tự tính lại. Dùng khi hỏi "hôm nay/ngày mai/tuần này/tuần sau có/dạy bao nhiêu buổi". Luôn ưu tiên dùng "period" thay vì tự tính fromIso/toIso.',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'tomorrow', 'this_week', 'next_week'],
              description:
                'Khoảng thời gian theo nghĩa tương đối (server tự tính chính xác theo giờ VN). "today" = hôm nay, "tomorrow" = ngày mai, "this_week" = tuần này (Thứ 2 - Chủ nhật), "next_week" = tuần sau.',
            },
            fromIso: {
              type: 'string',
              description:
                'Mốc bắt đầu dạng ISO 8601 — chỉ dùng khi câu hỏi nêu ngày cụ thể, không phải kỳ tương đối (bỏ qua nếu đã có "period").',
            },
            toIso: {
              type: 'string',
              description: 'Mốc kết thúc dạng ISO 8601 (tùy chọn, đi kèm fromIso).',
            },
          },
        },
      },
      {
        name: 'getMyTuitions',
        description:
          'Học phí và tình trạng thanh toán, kèm tổng hợp theo trạng thái. Dùng khi hỏi về học phí, còn nợ, đã đóng, quá hạn.',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['PAID', 'UNPAID', 'OVERDUE'],
              description: 'Lọc theo trạng thái học phí (tùy chọn).',
            },
          },
        },
      },
      {
        name: 'getMyAssignments',
        description:
          'Bài tập đã nộp/đang chấm của người dùng, kèm trạng thái và điểm. Trả về "count" — dùng đúng số này khi trả lời. Dùng khi hỏi về bài tập, bài chưa chấm, bài đã nộp.',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['SUBMITTED', 'GRADED', 'RESUBMIT'],
              description: 'Lọc theo trạng thái bài tập (tùy chọn).',
            },
          },
        },
      },
      {
        name: 'getMyScores',
        description:
          'Điểm số và nhận xét đã ghi nhận, kèm điểm trung bình. Dùng khi hỏi về kết quả học tập, điểm số, nhận xét.',
        parametersJsonSchema: { type: 'object', properties: {} },
      },
    ];
  }

  /** Runs the requested tool against the caller's scoped data. */
  async executeTool(
    name: string,
    args: Record<string, unknown>,
    ctx: AiUserContext,
  ): Promise<unknown> {
    const scope = await this.resolveScope(ctx);

    switch (name) {
      case 'getMyClasses':
        return this.classCtx.getMyClasses(scope.classIds);
      case 'getMyCurriculums':
        return this.classCtx.getMyCurriculums(ctx.userId);
      case 'getMySchedule':
        return this.scheduleCtx.getMySchedule(scope.classIds, args.dayOfWeek as string | undefined);
      case 'getUpcomingSessions':
        return this.sessionCtx.getUpcomingSessions(scope.classIds, {
          period: args.period as SessionPeriod | undefined,
          fromIso: args.fromIso as string | undefined,
          toIso: args.toIso as string | undefined,
        });
      case 'getMyTuitions':
        return this.classCtx.getMyTuitions({
          classIds: scope.classIds,
          studentIds: scope.studentIds,
          byClass: scope.byClass,
          status: args.status as string | undefined,
        });
      case 'getMyAssignments':
        return this.exerciseCtx.getMyAssignments({
          userId: ctx.userId,
          role: ctx.role,
          studentIds: scope.studentIds,
          status: args.status as string | undefined,
        });
      case 'getMyScores':
        return this.exerciseCtx.getMyScores({
          classIds: scope.classIds,
          studentIds: scope.studentIds,
          byClass: scope.byClass,
        });
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  /** Resolve which classes/students the caller may read data for. */
  private async resolveScope(ctx: AiUserContext): Promise<AiScope> {
    const byClass = ctx.role === 'TUTOR' || ctx.role === 'ADMIN';
    const studentIds = await this.resolveStudentIds(ctx);
    const classIds = await this.resolveClassIds(ctx, studentIds);
    return { classIds, studentIds, byClass };
  }

  private async resolveStudentIds(ctx: AiUserContext): Promise<string[]> {
    if (ctx.role === 'PARENT') {
      const children = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.parentId, ctx.userId));
      return children.map((c) => c.id);
    }
    return [ctx.userId];
  }

  private async resolveClassIds(ctx: AiUserContext, studentIds: string[]): Promise<string[]> {
    if (ctx.role === 'TUTOR') {
      const rows = await this.db
        .select({ id: classes.id })
        .from(classes)
        .where(eq(classes.tutorId, ctx.userId));
      return rows.map((r) => r.id);
    }

    if (ctx.role === 'ADMIN') {
      const rows = await this.db.select({ id: classes.id }).from(classes).limit(200);
      return rows.map((r) => r.id);
    }

    if (studentIds.length === 0) return [];
    const rows = await this.db
      .select({ id: classStudents.classId })
      .from(classStudents)
      .where(inArray(classStudents.studentId, studentIds));
    return [...new Set(rows.map((r) => r.id))];
  }
}
