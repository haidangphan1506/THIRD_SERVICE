import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classStudents, studentScores, sessions, users } from '../../database/schema';
import type {
  CreateStudentDto,
  GetStudentsQueryDto,
  UpdateStudentDto,
} from '@packages/entities/student';
import type { JwtGuardUser } from '../../packages/guards/jwt-auth.guard';
import { StudentRepository } from './student.repository';
import { generateCode, hashData } from '@packages/helpers';
import { randomUUID } from 'node:crypto';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);
  constructor(
    private readonly repo: StudentRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  private async generateUniqueCode(): Promise<string> {
    const MAX_RETRIES = 5;
    let attempts = 0;
    let newCode = generateCode();

    while (await this.repo.findByCode(newCode)) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        throw new ConflictException('Unable to generate unique code, please try again');
      }
      newCode = generateCode();
    }

    return newCode;
  }

  async generateStudentCodeService(): Promise<string> {
    return this.generateUniqueCode();
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const spaceIdx = name.indexOf(' ');
    return {
      firstName: spaceIdx === -1 ? name : name.slice(0, spaceIdx),
      lastName: spaceIdx === -1 ? '' : name.slice(spaceIdx + 1),
    };
  }

  private async generateUsernameFromName(firstName: string, lastName: string): Promise<string> {
    const base = `${lastName}${firstName}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    for (let i = 0; i < 10; i++) {
      const candidate = i === 0 ? base : `${base}_${i}`;
      const [existing] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, candidate))
        .limit(1);
      if (!existing) return candidate;
    }

    throw new ConflictException(`Cannot generate unique username for "${firstName} ${lastName}"`);
  }

  async create(dto: CreateStudentDto & { classId?: string }, currentUser: JwtGuardUser) {
    if (dto.userCode) {
      const existing = await this.repo.findByCode(dto.userCode);
      if (existing) {
        throw new BadRequestException(`Student code "${dto.userCode}" already exists`);
      }
    }

    const studentId = randomUUID();
    const { studentName, studentPhone, parentName, parentPhone } = dto;

    const { firstName: studentFirstName, lastName: studentLastName } = this.splitName(studentName);

    let parentId: string | null = null;

    if (parentName) {
      const parentUserId = randomUUID();
      const parentCode = await this.generateUniqueCode();
      const defaultPassword = randomUUID().slice(0, 12);
      const hashedParentPassword = await hashData(defaultPassword);
      const parentEmail = `parent_${parentUserId}@parent.local`;
      const { firstName: parentFirstName, lastName: parentLastName } = this.splitName(parentName);
      const parentUsername = await this.generateUsernameFromName(parentFirstName, parentLastName);

      const parent = await this.repo.createParent({
        id: parentUserId,
        email: parentEmail,
        password: hashedParentPassword,
        username: parentUsername,
        firstName: parentFirstName,
        lastName: parentLastName,
        userCode: parentCode,
        phone: parentPhone ?? null,
        tutorId: currentUser.id,
      });

      parentId = parent.id;
    }

    const resolvedEmail = dto.email ?? `${dto.userCode || studentId}@student.local`;
    const studentUsername = await this.generateUsernameFromName(studentFirstName, studentLastName);
    const hashedPassword = await hashData(dto.password);

    const student = await this.repo.create({
      id: studentId,
      email: resolvedEmail,
      password: hashedPassword,
      username: studentUsername,
      firstName: studentFirstName,
      lastName: studentLastName,
      userCode: dto.userCode ?? null,
      phone: studentPhone ?? null,
      avatar: dto.avatar ?? null,
      parentId,
      tutorId: currentUser.id,
    });

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
      createdAt:
        user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
      updatedAt:
        user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
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
