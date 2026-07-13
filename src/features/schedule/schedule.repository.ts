import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import {
  CreateScheduleDto,
  CreateSchedulesDto,
  UpdateScheduleDto,
} from '@packages/entities/schedule';
import { schedules } from 'src/database/schema';

@Injectable()
export class ScheduleRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create({ data }: { data: CreateScheduleDto }) {
    const [schedule] = await this.db
      .insert(schedules)
      .values({
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        format: data.format,
        location: data.location,
      })
      .returning();
    return schedule;
  }

  async createMany({
    classId,
    items,
  }: {
    classId: string;
    items: CreateSchedulesDto['schedules'];
  }) {
    const rows = await this.db
      .insert(schedules)
      .values(
        items.map((item) => ({
          classId,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          format: item.format,
          location: item.location,
        })),
      )
      .returning();
    return rows;
  }

  async getByClass({ classId }: { classId: string }) {
    return this.db
      .select()
      .from(schedules)
      .where(eq(schedules.classId, classId))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));
  }

  async getById({ id }: { id: string }) {
    const [schedule] = await this.db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
    return schedule;
  }

  async update({ id, data }: { id: string; data: UpdateScheduleDto }) {
    const [schedule] = await this.db
      .update(schedules)
      .set({
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        format: data.format,
        location: data.location,
        updatedAt: new Date(),
      })
      .where(eq(schedules.id, id))
      .returning();
    return schedule;
  }

  async del({ id }: { id: string }) {
    const [schedule] = await this.db.delete(schedules).where(eq(schedules.id, id)).returning();
    return !!schedule;
  }
}
