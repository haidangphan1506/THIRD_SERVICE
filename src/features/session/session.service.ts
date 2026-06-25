import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classes } from '../../database/schema';
import type {
  CreateScheduleDto,
  CreateSessionDto,
  GenerateSessionsDto,
  GetSessionsQueryDto,
  UpdateScheduleDto,
  UpdateSessionDto,
} from '@packages/entities/session';
import { SessionRepository } from './session.repository';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    private readonly repo: SessionRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  private async verifyClassOwner(classId: string, tutorId: string) {
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, classId));
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    return cls;
  }

  // ── Schedules ──

  async createSchedule(dto: CreateScheduleDto, tutorId: string) {
    await this.verifyClassOwner(dto.classId, tutorId);
    return this.repo.createSchedule(dto);
  }

  async getSchedulesByClass(classId: string, tutorId: string) {
    await this.verifyClassOwner(classId, tutorId);
    return this.repo.getSchedulesByClass(classId);
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto, tutorId: string) {
    const sched = await this.repo.getScheduleById(id);
    if (!sched) throw new NotFoundException('Schedule not found');
    await this.verifyClassOwner(sched.classId, tutorId);
    return this.repo.updateSchedule(id, dto);
  }

  async deleteSchedule(id: string, tutorId: string) {
    const sched = await this.repo.getScheduleById(id);
    if (!sched) throw new NotFoundException('Schedule not found');
    await this.verifyClassOwner(sched.classId, tutorId);
    await this.repo.deleteSchedule(id);
    return { id };
  }

  // ── Sessions ──

  async generateSessions(dto: GenerateSessionsDto, tutorId: string) {
    await this.verifyClassOwner(dto.classId, tutorId);

    const dayMap: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 0,
    };
    const targetDay = dayMap[dto.dayOfWeek];
    if (targetDay === undefined) {
      throw new BadRequestException('Invalid dayOfWeek');
    }

    let start: Date;
    let end: Date;
    const now = new Date();

    switch (dto.range) {
      case 'this_week': {
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case '4_weeks':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 28);
        break;
      case '3_months':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setMonth(start.getMonth() + 3);
        break;
      case 'custom':
        if (!dto.startDate || !dto.endDate) {
          throw new BadRequestException('startDate and endDate required for custom range');
        }
        start = new Date(dto.startDate);
        end = new Date(dto.endDate);
        break;
      default:
        throw new BadRequestException('Invalid range');
    }

    const sessionsToCreate: CreateSessionDto[] = [];
    const current = new Date(start);

    while (current <= end) {
      if (current.getDay() === targetDay) {
        sessionsToCreate.push({
          classId: dto.classId,
          title: `${dto.dayOfWeek} - ${current.toLocaleDateString('vi-VN')}`,
          date: new Date(current),
          startTime: dto.startTime,
          endTime: dto.endTime,
          format: dto.format,
          location: dto.location,
          status: 'UPCOMING',
        });
      }
      current.setDate(current.getDate() + 1);
    }

    const created = await this.repo.createSessionsBulk(sessionsToCreate);
    return {
      count: created.length,
      sessions: created,
      conflicts: [], // Could be enhanced with conflict checking
    };
  }

  async findAll(query: GetSessionsQueryDto) {
    return this.repo.findAll(query);
  }

  async findById(id: string) {
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async update(id: string, dto: UpdateSessionDto, tutorId: string) {
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    await this.verifyClassOwner(session.classId, tutorId);
    return this.repo.updateSession(id, dto);
  }

  async updateStatus(id: string, status: string, tutorId: string) {
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    await this.verifyClassOwner(session.classId, tutorId);
    return this.repo.updateSession(id, { status });
  }

  async delete(id: string, tutorId: string) {
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    await this.verifyClassOwner(session.classId, tutorId);
    await this.repo.deleteSession(id);
    return { id };
  }
}
