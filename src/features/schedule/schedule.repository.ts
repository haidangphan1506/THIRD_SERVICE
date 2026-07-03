import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { schedules } from '../../database/schema';
import type { CreateScheduleDto } from '@packages/entities/schedule';

@Injectable()
export class ScheduleRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(data: CreateScheduleDto) {
    const [sched] = await this.db.insert(schedules).values(data).returning();
    return sched;
  }

  async createBulk(data: CreateScheduleDto[]) {
    if (data.length === 0) return [];
    return this.db.insert(schedules).values(data).returning();
  }

  async findByClass(classId: string) {
    return this.db.select().from(schedules).where(eq(schedules.classId, classId));
  }

  async findById(id: string) {
    const [sched] = await this.db.select().from(schedules).where(eq(schedules.id, id));
    return sched ?? null;
  }

  async update(id: string, data: Record<string, unknown>) {
    const [sched] = await this.db
      .update(schedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return sched ?? null;
  }

  async delete(id: string) {
    const [sched] = await this.db.delete(schedules).where(eq(schedules.id, id)).returning();
    return !!sched;
  }

  async deleteByClass(classId: string) {
    await this.db.delete(schedules).where(eq(schedules.classId, classId));
  }
}
