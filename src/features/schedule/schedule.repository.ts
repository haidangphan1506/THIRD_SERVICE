import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classes, schedules } from '../../database/schema';
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

  private classBasicInfo() {
    return {
      id: classes.id,
      name: classes.name,
      code: classes.code,
      subject: classes.subject,
      status: classes.status,
    };
  }

  async findByClass(classId: string) {
    const rows = await this.db
      .select({ schedule: schedules, class: this.classBasicInfo() })
      .from(schedules)
      .innerJoin(classes, eq(schedules.classId, classes.id))
      .where(eq(schedules.classId, classId));
    return rows.map((row) => ({ ...row.schedule, class: row.class }));
  }

  async findByTutor(tutorId: string) {
    const rows = await this.db
      .select({ schedule: schedules, class: this.classBasicInfo() })
      .from(schedules)
      .innerJoin(classes, eq(schedules.classId, classes.id))
      .where(eq(classes.tutorId, tutorId));
    return rows.map((row) => ({ ...row.schedule, class: row.class }));
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
