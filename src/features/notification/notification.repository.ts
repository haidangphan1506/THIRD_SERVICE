import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { notifications } from '../../database/schema';
import type {
  CreateNotificationDto,
  GetNotificationsQueryDto,
} from '@packages/entities/notification';

@Injectable()
export class NotificationRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(data: CreateNotificationDto) {
    const [note] = await this.db
      .insert(notifications)
      .values({
        type: data.type,
        subtype: data.subtype ?? null,
        title: data.title,
        content: data.content ?? null,
        userId: data.userId ?? null,
        classId: data.classId ?? null,
        studentId: data.studentId ?? null,
      })
      .returning();
    return note;
  }

  async findAll(query: GetNotificationsQueryDto) {
    const { page, limit, type, userId, isRead } = query;
    const conditions: SQL[] = [];

    if (type) conditions.push(eq(notifications.type, type));
    if (userId) conditions.push(eq(notifications.userId, userId));
    if (isRead !== undefined) conditions.push(eq(notifications.isRead, isRead));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.db.select({ total: count() }).from(notifications).where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const [note] = await this.db.select().from(notifications).where(eq(notifications.id, id));
    return note ?? null;
  }

  async markAsRead(id: string) {
    const [note] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return note ?? null;
  }

  async markAllAsRead(userId: string) {
    const result = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    return result;
  }

  async delete(id: string) {
    const [note] = await this.db.delete(notifications).where(eq(notifications.id, id)).returning();
    return !!note;
  }
}
