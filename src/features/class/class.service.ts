import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { classStudents, users } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, inArray } from 'drizzle-orm';
import type { CreateClassDto, GetClassesQueryDto, UpdateClassDto } from '@packages/entities/class';
import { ClassRepository } from './class.repository';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);
  constructor(
    private readonly repo: ClassRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(dto: CreateClassDto, tutorId: string) {
    const code = dto.code ?? (await this.generateUniqueCode());
    const existing = await this.repo.findByCode(code);
    if (existing) {
      throw new BadRequestException(`Class code "${code}" already exists`);
    }
    const { studentIds, ...classData } = dto;
    const cls = await this.repo.create({ ...classData, code, tutorId });
    const students = studentIds?.length
      ? await this.syncStudents(cls.id, studentIds)
      : [];
    return { ...cls, students };
  }

  async generateCode(): Promise<{ code: string }> {
    const code = await this.generateUniqueCode();
    return { code };
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await this.repo.findByCode(code);
      if (!existing) return code;
    }
    throw new BadRequestException('Could not generate unique class code, please try again');
  }

  private async syncStudents(
    classId: string,
    studentIds: string[],
  ): Promise<Record<string, unknown>[]> {
    const existingUsers = await this.db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, studentIds));
    const existingIds = new Set(existingUsers.map((u) => u.id));
    const invalidIds = studentIds.filter((id) => !existingIds.has(id));
    if (invalidIds.length) {
      throw new BadRequestException(`Student(s) not found: ${invalidIds.join(', ')}`);
    }

    await this.db.delete(classStudents).where(eq(classStudents.classId, classId));
    if (studentIds.length) {
      await this.db
        .insert(classStudents)
        .values(studentIds.map((studentId) => ({ classId, studentId })));
    }

    return this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        username: users.username,
        avatar: users.avatar,
      })
      .from(users)
      .where(inArray(users.id, studentIds));
  }

  async findAll(tutorId: string, query: GetClassesQueryDto) {
    return this.repo.findAll({ tutorId, query });
  }

  async findById(id: string, tutorId: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
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
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
    const cls = await this.repo.findById(id);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const { studentIds, ...classUpdateData } = dto;
    const updated = await this.repo.update(id, classUpdateData);
    if (!updated) throw new NotFoundException('Class not found');
    const students = studentIds ? await this.syncStudents(id, studentIds) : undefined;
    return { ...updated, ...(students !== undefined && { students }) };
  }

  async delete(id: string, tutorId: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
    const cls = await this.repo.findById(id);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    await this.repo.delete(id);
    return { id };
  }

  async addStudent(classId: string, studentId: string, tutorId: string) {
    if (!classId || !checkUuidValid({ data: classId })) throw new BadRequestException('classId must be uuid ...');
    if (!studentId || !checkUuidValid({ data: studentId })) throw new BadRequestException('studentId must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
    const cls = await this.repo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const [student] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, studentId));
    if (!student) throw new NotFoundException('Student not found');
    await this.db.insert(classStudents).values({ classId, studentId }).onConflictDoNothing();
    return { classId, studentId };
  }

  async removeStudent(classId: string, studentId: string, tutorId: string) {
    if (!classId || !checkUuidValid({ data: classId })) throw new BadRequestException('classId must be uuid ...');
    if (!studentId || !checkUuidValid({ data: studentId })) throw new BadRequestException('studentId must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
    const cls = await this.repo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const [student] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, studentId));
    if (!student) throw new NotFoundException('Student not found');
    await this.db
      .delete(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));
    return { classId, studentId };
  }

  async getStudents(classId: string, tutorId: string) {
    if (!classId || !checkUuidValid({ data: classId })) throw new BadRequestException('classId must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
    const cls = await this.repo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const rows = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        username: users.username,
        avatar: users.avatar,
      })
      .from(classStudents)
      .innerJoin(users, eq(classStudents.studentId, users.id))
      .where(eq(classStudents.classId, classId));
    return rows;
  }
}
