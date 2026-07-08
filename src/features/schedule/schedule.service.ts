import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classes } from '../../database/schema';
import type {
  CreateScheduleDto,
  CreateSchedulesDto,
  UpdateScheduleDto,
} from '@packages/entities/schedule';
import { ScheduleRepository } from './schedule.repository';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(
    private readonly repo: ScheduleRepository,
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

  async createBulk(dto: CreateSchedulesDto, tutorId: string) {
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    if (!dto.classId || !checkUuidValid({ data: dto.classId }))
      throw new BadRequestException('classId must be uuid ...');
    await this.verifyClassOwner(dto.classId, tutorId);
    const items = dto.schedules.map((s) => ({ ...s, classId: dto.classId }));
    const created = await this.repo.createBulk(items);
    return { count: created.length, schedules: created };
  }

  async findByClass(classId: string, tutorId: string) {
    if (!classId || !checkUuidValid({ data: classId }))
      throw new BadRequestException('classId must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    await this.verifyClassOwner(classId, tutorId);
    return this.repo.findByClass(classId);
  }

  async findAll(tutorId: string, classId?: string) {
    if (classId) {
      return this.findByClass(classId, tutorId);
    }
    return this.repo.findByTutor(tutorId);
  }

  async update(id: string, dto: UpdateScheduleDto, tutorId: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    const sched = await this.repo.findById(id);
    if (!sched) throw new NotFoundException('Schedule not found');
    await this.verifyClassOwner(sched.classId, tutorId);
    const updated = await this.repo.update(id, dto);
    return updated;
  }

  async delete(id: string, tutorId: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    const sched = await this.repo.findById(id);
    if (!sched) throw new NotFoundException('Schedule not found');
    await this.verifyClassOwner(sched.classId, tutorId);
    await this.repo.delete(id);
    return { id };
  }

  async replaceByClass(classId: string, schedules: CreateScheduleDto[], tutorId: string) {
    if (!classId || !checkUuidValid({ data: classId }))
      throw new BadRequestException('classId must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    await this.verifyClassOwner(classId, tutorId);
    await this.repo.deleteByClass(classId);
    if (schedules.length === 0) return { count: 0, schedules: [] };
    const items = schedules.map((s) => ({ ...s, classId }));
    const created = await this.repo.createBulk(items);
    return { count: created.length, schedules: created };
  }
}
