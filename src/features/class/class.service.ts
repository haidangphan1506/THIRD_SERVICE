import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { classStudents, curriculums, sessions, users } from '../../database/schema';
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
    if (!tutorId || !checkUuidValid({ data: tutorId })) {
      throw new BadRequestException('tutorId must be uuid ...');
    }

    // Resolve class code: use provided (must be unique) or auto-generate.
    let code = dto.code?.trim();
    if (code) {
      const existing = await this.repo.findByCode(code);
      if (existing) {
        throw new BadRequestException(`Class code "${code}" already exists`);
      }
    } else {
      code = await this.generateUniqueCode();
    }

    const cls = await this.repo.create({ ...dto, code, tutorId });
    if (!cls) {
      throw new BadRequestException('Failed to create class');
    }

    const students =
      dto.studentIds && dto.studentIds.length
        ? await this.syncStudents(cls.id, dto.studentIds)
        : undefined;

    // Seed 2 default sessions counting from the current date (weekly, 18:00–20:00).
    await this.seedInitialSessions(cls.id, tutorId);

    return {
      ...cls,
      tuition: cls.tuition != null ? String(cls.tuition) : '0',
      startTime:
        cls.startTime instanceof Date ? cls.startTime.toISOString() : String(cls.startTime),
      endTime: cls.endTime instanceof Date ? cls.endTime.toISOString() : String(cls.endTime),
      createdAt:
        cls.createdAt instanceof Date ? cls.createdAt.toISOString() : String(cls.createdAt),
      updatedAt:
        cls.updatedAt instanceof Date ? cls.updatedAt.toISOString() : String(cls.updatedAt),
      ...(students !== undefined && { students }),
    };
  }

  /**
   * Creates 2 initial sessions for a freshly-created class, counting from today.
   * Session 1 starts today, session 2 one week later; both 18:00–20:00.
   * Failure is logged but does not fail class creation.
   */
  private async seedInitialSessions(classId: string, tutorId: string) {
    const buildSession = (dayOffset: number, sessionNumber: number) => {
      const startAt = new Date();
      startAt.setDate(startAt.getDate() + dayOffset);
      startAt.setHours(18, 0, 0, 0);
      const endAt = new Date(startAt);
      endAt.setHours(20, 0, 0, 0);
      return {
        classId,
        tutorId,
        sessionNumber,
        title: `Buổi ${sessionNumber}`,
        startAt,
        endAt,
        status: 'SCHEDULED' as const,
      };
    };

    try {
      await this.db.insert(sessions).values([buildSession(0, 1), buildSession(7, 2)]);
    } catch (err) {
      this.logger.warn(
        `Failed to seed initial sessions for class ${classId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async generateCode(): Promise<{ code: string }> {
    const code = await this.generateUniqueCode();
    return { code };
  }

  /**
   * Syncs the students' gradesId from the class's curriculum grade.
   * Adds the curriculum's gradesId to each student's gradesId array if not already present.
   */
  private async updateStudentGrades(classId: string, studentIds: string[]) {
    if (!studentIds.length) return;

    const cls = await this.repo.findById(classId);
    if (!cls || !cls.curriculumId) return;

    const [curriculum] = await this.db
      .select({ gradesId: curriculums.gradesId })
      .from(curriculums)
      .where(eq(curriculums.id, cls.curriculumId));

    const gradeId = curriculum?.gradesId;
    if (!gradeId) return;

    for (const studentId of studentIds) {
      const [user] = await this.db
        .select({ gradesId: users.gradesId })
        .from(users)
        .where(eq(users.id, studentId));

      if (user) {
        const current = user.gradesId || [];
        if (!current.includes(gradeId)) {
          await this.db
            .update(users)
            .set({ gradesId: [...current, gradeId] })
            .where(eq(users.id, studentId));
        }
      }
    }
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

    // Clear classId for old students
    const oldStudents = await this.db
      .select({ studentId: classStudents.studentId })
      .from(classStudents)
      .where(eq(classStudents.classId, classId));
    const oldStudentIds = oldStudents.map((s) => s.studentId);
    if (oldStudentIds.length) {
      await this.db.update(users).set({ classId: null }).where(inArray(users.id, oldStudentIds));
    }

    await this.db.delete(classStudents).where(eq(classStudents.classId, classId));
    if (studentIds.length) {
      await this.db
        .insert(classStudents)
        .values(studentIds.map((studentId) => ({ classId, studentId })));

      // Set classId for new students
      await this.db.update(users).set({ classId }).where(inArray(users.id, studentIds));

      // Sync gradesId from the class's curriculum grade
      await this.updateStudentGrades(classId, studentIds);
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
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
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
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
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
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    const cls = await this.repo.findById(id);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }

    // Clear classId for all students in this class before deleting
    const students = await this.db
      .select({ studentId: classStudents.studentId })
      .from(classStudents)
      .where(eq(classStudents.classId, id));
    const studentIds = students.map((s) => s.studentId);
    if (studentIds.length) {
      await this.db.update(users).set({ classId: null }).where(inArray(users.id, studentIds));
    }

    await this.repo.delete(id);
    return { id };
  }

  async addStudent(classId: string, studentId: string, tutorId: string) {
    if (!classId || !checkUuidValid({ data: classId }))
      throw new BadRequestException('classId must be uuid ...');
    if (!studentId || !checkUuidValid({ data: studentId }))
      throw new BadRequestException('studentId must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    const cls = await this.repo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const [student] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, studentId));
    if (!student) throw new NotFoundException('Student not found');
    await this.db.insert(classStudents).values({ classId, studentId }).onConflictDoNothing();
    // Update classId on user
    await this.db.update(users).set({ classId }).where(eq(users.id, studentId));
    // Sync gradesId from the class's curriculum grade
    await this.updateStudentGrades(classId, [studentId]);
    return { classId, studentId };
  }

  async removeStudent(classId: string, studentId: string, tutorId: string) {
    if (!classId || !checkUuidValid({ data: classId }))
      throw new BadRequestException('classId must be uuid ...');
    if (!studentId || !checkUuidValid({ data: studentId }))
      throw new BadRequestException('studentId must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    const cls = await this.repo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const [student] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, studentId));
    if (!student) throw new NotFoundException('Student not found');
    await this.db
      .delete(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));
    // Clear classId on user
    await this.db.update(users).set({ classId: null }).where(eq(users.id, studentId));
    return { classId, studentId };
  }

  async getStudents(classId: string, tutorId: string) {
    if (!classId || !checkUuidValid({ data: classId }))
      throw new BadRequestException('classId must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
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
        userCode: users.userCode,
        parentId: users.parentId,
      })
      .from(classStudents)
      .innerJoin(users, eq(classStudents.studentId, users.id))
      .where(eq(classStudents.classId, classId));

    // Resolve parent phone numbers for the "SĐT PH" column.
    const parentIds = rows.map((r) => r.parentId).filter((id): id is string => !!id);
    const parentPhoneMap = new Map<string, string | null>();
    if (parentIds.length) {
      const parents = await this.db
        .select({ id: users.id, phone: users.phone })
        .from(users)
        .where(inArray(users.id, parentIds));
      for (const p of parents) parentPhoneMap.set(p.id, p.phone);
    }

    return rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      username: r.username,
      avatar: r.avatar,
      userCode: r.userCode ?? null,
      parentPhone: r.parentId ? (parentPhoneMap.get(r.parentId) ?? null) : null,
    }));
  }
}
