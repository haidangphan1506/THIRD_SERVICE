import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classStudents, studentScores, sessions } from '../../database/schema';
import type {
  CreateStudentDto,
  GetStudentsQueryDto,
  UpdateStudentDto,
} from '@packages/entities/student';
import { StudentRepository } from './student.repository';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);
  constructor(
    private readonly repo: StudentRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(dto: CreateStudentDto & { classId?: string }) {
    if (dto.userCode) {
      const existing = await this.repo.findByCode(dto.userCode);
      if (existing) {
        throw new BadRequestException(`Student code "${dto.userCode}" already exists`);
      }
    }

    const student = await this.repo.create(dto);

    if (dto.classId) {
      await this.db
        .insert(classStudents)
        .values({ classId: dto.classId, studentId: student.id })
        .onConflictDoNothing();
    }
    return student;
  }

  async findAll(query: GetStudentsQueryDto) {
    return this.repo.findAll(query);
  }

  async findById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Student not found');

    const [scoreRow] = await this.db
      .select({ score: studentScores.score })
      .from(studentScores)
      .where(eq(studentScores.studentId, id))
      .limit(1);

    const classRows = await this.db
      .select()
      .from(classStudents)
      .where(eq(classStudents.studentId, id));

    const sessionRows = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.classId, classRows[0]?.classId ?? ''))
      .limit(10);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      userCode: user.userCode,
      phone: user.phone,
      avatar: user.avatar,
      parentId: user.parentId,
      role: user.role,
      isActive: user.isActive,
      classCount: classRows.length,
      score: scoreRow?.score ? String(scoreRow.score) : null,
      classes: classRows,
      recentSessions: sessionRows,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
    };
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.repo.findById(id);
    if (!student) throw new NotFoundException('Student not found');
    return this.repo.update(id, dto);
  }

  async delete(id: string) {
    const student = await this.repo.findById(id);
    if (!student) throw new NotFoundException('Student not found');
    await this.repo.delete(id);
    return { id };
  }
}
