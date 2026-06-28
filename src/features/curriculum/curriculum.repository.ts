import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { assignments, curriculums } from '../../database/schema';
import type { CreateAssignmentDto, CreateCurriculumDto } from '@packages/entities/curriculum';

@Injectable()
export class CurriculumRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  // ── Curriculums ──

  async createCurriculum(data: CreateCurriculumDto) {
    const [curr] = await this.db.insert(curriculums).values(data).returning();
    return curr;
  }

  async getCurriculumsByClass(classId: string) {
    return this.db
      .select()
      .from(curriculums)
      .where(eq(curriculums.classId, classId))
      .orderBy(asc(curriculums.lesson), asc(curriculums.order));
  }

  async getCurriculumById(id: string) {
    const [curr] = await this.db.select().from(curriculums).where(eq(curriculums.id, id));
    return curr ?? null;
  }

  async updateCurriculum(id: string, data: Record<string, unknown>) {
    const [curr] = await this.db
      .update(curriculums)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(curriculums.id, id))
      .returning();
    return curr ?? null;
  }

  async deleteCurriculum(id: string) {
    const [curr] = await this.db.delete(curriculums).where(eq(curriculums.id, id)).returning();
    return !!curr;
  }

  // ── Assignments ──

  async createAssignment(data: CreateAssignmentDto) {
    const [asgn] = await this.db
      .insert(assignments)
      .values({
        ...data,
        score: data.score != null ? String(data.score) : null,
      })
      .returning();
    return asgn;
  }

  async getAssignmentsByClass(classId: string, lesson?: number) {
    const conditions = [eq(assignments.classId, classId)];
    if (lesson) conditions.push(eq(assignments.lesson, lesson));
    return this.db
      .select()
      .from(assignments)
      .where(and(...conditions))
      .orderBy(asc(assignments.lesson), desc(assignments.createdAt));
  }

  async getAssignmentById(id: string) {
    const [asgn] = await this.db.select().from(assignments).where(eq(assignments.id, id));
    return asgn ?? null;
  }

  async updateAssignment(id: string, data: Record<string, unknown>) {
    const [asgn] = await this.db
      .update(assignments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return asgn ?? null;
  }

  async deleteAssignment(id: string) {
    const [asgn] = await this.db.delete(assignments).where(eq(assignments.id, id)).returning();
    return !!asgn;
  }

  async toggleHidden(id: string) {
    const asgn = await this.getAssignmentById(id);
    if (!asgn) return null;
    return this.updateAssignment(id, { isHidden: !asgn.isHidden });
  }
}
