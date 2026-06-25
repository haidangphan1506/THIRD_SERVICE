import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { classStudents } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import type { CreateClassDto, GetClassesQueryDto, UpdateClassDto } from '@packages/entities/class';
import { ClassRepository } from './class.repository';

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);
  constructor(
    private readonly repo: ClassRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(dto: CreateClassDto, tutorId: string) {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new BadRequestException(`Class code "${dto.code}" already exists`);
    }
    const cls = await this.repo.create({ ...dto, tutorId });
    return cls;
  }

  async findAll(tutorId: string, query: GetClassesQueryDto) {
    return this.repo.findAll({ tutorId, query });
  }

  async findById(id: string, tutorId: string) {
    const cls = await this.repo.findById(id);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const studentCount = await this.repo.getStudentCount(id);
    const { total: sessionCount, upcoming: upcomingSessionCount } =
      await this.repo.getSessionCount(id);
    return {
      ...cls,
      tuition: cls.tuition != null ? String(cls.tuition) : '0',
      studentCount,
      sessionCount,
      upcomingSessionCount,
      createdAt:
        cls.createdAt instanceof Date ? cls.createdAt.toISOString() : String(cls.createdAt),
      updatedAt:
        cls.updatedAt instanceof Date ? cls.updatedAt.toISOString() : String(cls.updatedAt),
    };
  }

  async update(id: string, dto: UpdateClassDto, tutorId: string) {
    const cls = await this.repo.findById(id);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const updated = await this.repo.update(id, dto);
    return updated;
  }

  async delete(id: string, tutorId: string) {
    const cls = await this.repo.findById(id);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    await this.repo.delete(id);
    return { id };
  }

  async addStudent(classId: string, studentId: string, tutorId: string) {
    const cls = await this.repo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    await this.db.insert(classStudents).values({ classId, studentId }).onConflictDoNothing();
    return { classId, studentId };
  }

  async removeStudent(classId: string, studentId: string, tutorId: string) {
    const cls = await this.repo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    await this.db
      .delete(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));
    return { classId, studentId };
  }

  async getStudents(classId: string, tutorId: string) {
    const cls = await this.repo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const rows = await this.db
      .select()
      .from(classStudents)
      .where(eq(classStudents.classId, classId));
    return rows;
  }
}
