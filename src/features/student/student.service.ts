import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { and, eq, ilike } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classes, classStudents, studentScores, sessions, users } from '../../database/schema';
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
    const {
      studentName,
      studentPhone,
      parentName,
      parentPhone,
      parentEmail,
      parentRelationship,
      gender,
      birthday,
      school,
      className,
    } = dto;

    const { firstName: studentFirstName, lastName: studentLastName } = this.splitName(studentName);

    let parentId: string | null = null;

    if (parentName) {
      const parentUserId = randomUUID();
      const parentCode = await this.generateUniqueCode();
      const hashedParentPassword = await hashData('Parent@123456');
      const resolvedParentEmail = parentEmail ?? '';
      const { firstName: parentFirstName, lastName: parentLastName } = this.splitName(parentName);
      const parentUsername = await this.generateUsernameFromName(parentFirstName, parentLastName);

      const parent = await this.repo.createParent({
        id: parentUserId,
        email: resolvedParentEmail,
        password: hashedParentPassword,
        username: parentUsername,
        firstName: parentFirstName,
        lastName: parentLastName,
        userCode: parentCode,
        phone: parentPhone ?? null,
        relationship: parentRelationship ?? null,
        tutorId: currentUser.id,
      });

      parentId = parent.id;
    }

    const resolvedEmail = dto.email ?? '';
    const studentUsername = await this.generateUsernameFromName(studentFirstName, studentLastName);
    const hashedPassword = await hashData('Student@123456');

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
      gender: gender ?? null,
      dateOfBirth: birthday ?? null,
      school: school ?? null,
      parentId,
      tutorId: currentUser.id,
    });

    // Explicit class enrollment by id
    if (dto.classId) {
      await this.db
        .insert(classStudents)
        .values({ classId: dto.classId, studentId: student.id })
        .onConflictDoNothing();
    } else if (className?.trim()) {
      // Best-effort enrollment: match one of the tutor's classes by name
      const [matchedClass] = await this.db
        .select({ id: classes.id })
        .from(classes)
        .where(and(eq(classes.tutorId, currentUser.id), ilike(classes.name, className.trim())))
        .limit(1);
      if (matchedClass) {
        await this.db
          .insert(classStudents)
          .values({ classId: matchedClass.id, studentId: student.id })
          .onConflictDoNothing();
      }
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

    let parentName: string | null = null;
    let parentPhone: string | null = null;
    let parentEmail: string | null = null;
    let parentRelationship: string | null = null;
    if (user.parentId) {
      const [parent] = await this.db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          email: users.email,
          relationship: users.relationship,
        })
        .from(users)
        .where(eq(users.id, user.parentId))
        .limit(1);
      if (parent) {
        parentName = `${parent.firstName} ${parent.lastName}`.trim();
        parentPhone = parent.phone;
        parentEmail = parent.email;
        parentRelationship = parent.relationship;
      }
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      userCode: user.userCode,
      phone: user.phone,
      avatar: user.avatar,
      gender: user.gender,
      dateOfBirth:
        user.dateOfBirth instanceof Date ? user.dateOfBirth.toISOString() : user.dateOfBirth,
      school: user.school,
      parentId: user.parentId,
      parentName,
      parentPhone,
      parentEmail,
      parentRelationship,
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

    // ── student fields ──
    const studentUpdate: Partial<typeof users.$inferInsert> = {};
    if (dto.studentName !== undefined) {
      const { firstName, lastName } = this.splitName(dto.studentName);
      studentUpdate.firstName = firstName;
      studentUpdate.lastName = lastName;
    }
    if (dto.studentPhone !== undefined) studentUpdate.phone = dto.studentPhone || null;
    if (dto.gender !== undefined) studentUpdate.gender = dto.gender;
    if (dto.birthday !== undefined) studentUpdate.dateOfBirth = dto.birthday;
    if (dto.school !== undefined) studentUpdate.school = dto.school || null;
    if (dto.avatar !== undefined) studentUpdate.avatar = dto.avatar;

    let updated = student;
    if (Object.keys(studentUpdate).length > 0) {
      updated = (await this.repo.update(id, studentUpdate)) ?? student;
    }

    // ── parent fields ──
    const hasParentField =
      dto.parentName !== undefined ||
      dto.parentPhone !== undefined ||
      dto.parentEmail !== undefined ||
      dto.parentRelationship !== undefined;

    if (hasParentField) {
      if (student.parentId) {
        const parentUpdate: Partial<typeof users.$inferInsert> = {};
        if (dto.parentName !== undefined) {
          const { firstName, lastName } = this.splitName(dto.parentName);
          parentUpdate.firstName = firstName;
          parentUpdate.lastName = lastName;
        }
        if (dto.parentPhone !== undefined) parentUpdate.phone = dto.parentPhone || null;
        if (dto.parentEmail !== undefined) parentUpdate.email = dto.parentEmail;
        if (dto.parentRelationship !== undefined)
          parentUpdate.relationship = dto.parentRelationship;
        if (Object.keys(parentUpdate).length > 0) {
          await this.repo.updateParent(student.parentId, parentUpdate);
        }
      } else if (dto.parentName) {
        // No parent linked yet — create one (mirrors create flow)
        const parentUserId = randomUUID();
        const parentCode = await this.generateUniqueCode();
        const hashedParentPassword = await hashData('Parent@123456');
        const resolvedParentEmail = dto.parentEmail ?? '';
        const { firstName, lastName } = this.splitName(dto.parentName);
        const parentUsername = await this.generateUsernameFromName(firstName, lastName);
        const parent = await this.repo.createParent({
          id: parentUserId,
          email: resolvedParentEmail,
          password: hashedParentPassword,
          username: parentUsername,
          firstName,
          lastName,
          userCode: parentCode,
          phone: dto.parentPhone ?? null,
          relationship: dto.parentRelationship ?? null,
          tutorId: student.tutorId,
        });
        updated = (await this.repo.update(id, { parentId: parent.id })) ?? updated;
      }
    }

    // ── best-effort class enrollment by name ──
    if (dto.className?.trim() && student.tutorId) {
      const [matchedClass] = await this.db
        .select({ id: classes.id })
        .from(classes)
        .where(and(eq(classes.tutorId, student.tutorId), ilike(classes.name, dto.className.trim())))
        .limit(1);
      if (matchedClass) {
        await this.db
          .insert(classStudents)
          .values({ classId: matchedClass.id, studentId: id })
          .onConflictDoNothing();
      }
    }

    return updated;
  }

  async delete(id: string) {
    const student = await this.repo.findById(id);
    if (!student) throw new NotFoundException('Student not found');
    await this.repo.delete(id);
    return { id };
  }
}
