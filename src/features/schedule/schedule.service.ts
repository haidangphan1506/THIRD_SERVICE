import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CreateScheduleDto,
  CreateSchedulesDto,
  UpdateScheduleDto,
} from '@packages/entities/schedule';
import { checkUuidValid } from '@packages/helpers';
import { ScheduleRepository } from './schedule.repository';
import { ClassService } from '../class/class.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(
    private readonly repo: ScheduleRepository,
    private readonly classService: ClassService,
  ) {}

  // todo : ensure the acting user owns the target class ...
  private async assertClassOwner({ userId, classId }: { userId: string; classId: string }) {
    if (!classId || !checkUuidValid({ data: classId }))
      throw new BadRequestException('Class Id must be uuid ...');

    const classData = await this.classService.getClassService({ userId, id: classId });
    if (!classData || (Array.isArray(classData) && classData.length === 0))
      throw new NotFoundException('Class not found ...');
    if (classData.tutorId !== userId) throw new NotFoundException('Class not found ...');

    return classData;
  }

  private async loadOwnedSchedule({ userId, id }: { userId: string; id: string }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');
    if (!id || !checkUuidValid({ data: id }))
      throw new BadRequestException('Schedule Id must be uuid ...');

    const schedule = await this.repo.getById({ id });
    if (!schedule) throw new NotFoundException('Schedule not found ...');

    await this.assertClassOwner({ userId, classId: schedule.classId });
    return schedule;
  }

  async createScheduleService({ userId, data }: { userId: string; data: CreateScheduleDto }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');

    await this.assertClassOwner({ userId, classId: data.classId });
    return this.repo.create({ data });
  }

  async createSchedulesService({ userId, data }: { userId: string; data: CreateSchedulesDto }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');

    await this.assertClassOwner({ userId, classId: data.classId });
    return this.repo.createMany({ classId: data.classId, items: data.schedules });
  }

  async getSchedulesByClassService({ userId, classId }: { userId: string; classId: string }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');

    await this.assertClassOwner({ userId, classId });
    return this.repo.getByClass({ classId });
  }

  async getScheduleService({ userId, id }: { userId: string; id: string }) {
    return this.loadOwnedSchedule({ userId, id });
  }

  async updateScheduleService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: UpdateScheduleDto;
  }) {
    await this.loadOwnedSchedule({ userId, id });
    return this.repo.update({ id, data });
  }

  async delScheduleService({ userId, id }: { userId: string; id: string }) {
    await this.loadOwnedSchedule({ userId, id });

    const deleted = await this.repo.del({ id });
    if (!deleted) throw new NotFoundException('Schedule not found ...');

    return { id };
  }
}
