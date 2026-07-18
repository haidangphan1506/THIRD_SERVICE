import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from 'src/data/constants';
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

  // TODO: generate unique code ...
  private async generateUniqueCode(): Promise<string> {
    const MAX_RETRIES = 5;
    let attempts = 0;
    let newCode = generateCode();

    while (await this.repo.getStudentByField({ field: 'userCode', value: newCode })) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        throw new ConflictException(ERROR_MESSAGES.UNABLE_TO_GENERATE_UNIQUE_CODE);
      }
      newCode = generateCode();
    }

    return newCode;
  }

  // TODO: generate unique code services ...
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

  // TODO: generate username from full name ...
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

    throw new ConflictException(
      `${ERROR_MESSAGES.UNABLE_TO_GENERATE_USERNAME}: ${firstName} ${lastName}`,
    );
  }

  /**
   * Create a new student, auto-creating a linked PARENT account when parent info is supplied.
   * The creating user (tutor/admin) is recorded as `tutorId` on both records.
   */
  async create(dto: CreateStudentDto, currentUser: JwtGuardUser) {
    // 1. Resolve the student code: if the client supplied one, it must be free — reject the
    // request instead of silently generating a different code. Otherwise, auto-generate one.
    let studentCode: string;
    if (dto.userCode) {
      const taken = await this.repo.getStudentByField({ field: 'userCode', value: dto.userCode });
      if (taken)
        throw new ConflictException(`${ERROR_MESSAGES.STUDENT_CODE_EXISTS}: ${dto.userCode}`);
      studentCode = dto.userCode;
    } else {
      studentCode = await this.generateUniqueCode();
    }

    // 2. Split the student's full name into the first/last name columns `users` expects.
    const { firstName, lastName } = this.splitName(dto.studentName);

    // 3. Generate a unique username + default password for the new student login.
    const studentUsername = await this.generateUsernameFromName(firstName, lastName);
    const hashedStudentPassword = await hashData('Student@123456');

    // 4. If parent info was submitted, create the PARENT user first so it can be linked below.
    let parentId: string | null = null;
    if (dto.parentName) {
      const { firstName: parentFirstName, lastName: parentLastName } = this.splitName(
        dto.parentName,
      );
      const parentUsername = await this.generateUsernameFromName(parentFirstName, parentLastName);
      const parentCode = await this.generateUniqueCode();
      const hashedParentPassword = await hashData('Parent@123456');

      const parent = await this.repo.createParent({
        id: randomUUID(),
        email: dto.parentEmail || '',
        password: hashedParentPassword,
        username: parentUsername,
        firstName: parentFirstName,
        lastName: parentLastName,
        userCode: parentCode,
        phone: dto.parentPhone ?? null,
        relationship: dto.parentRelationship ?? null,
        gender: dto.parentRelationship === 'FATHER' ? 'MALE' : 'FEMALE',
        tutorId: currentUser.id,
      });
      parentId = parent.id;
    }

    // 5. Create the student, linking the parent (if any) and the creating tutor/admin.
    const student = await this.repo.createStudent({
      id: randomUUID(),
      email: dto.email || `${studentUsername}@no-email.local`,
      password: hashedStudentPassword,
      username: studentUsername,
      firstName,
      lastName,
      userCode: studentCode,
      phone: dto.studentPhone ?? null,
      avatar: null,
      gender: dto.gender ?? null,
      dateOfBirth: null,
      school: dto.school ?? null,
      parentId,
      tutorId: currentUser.id,
    });

    return student;
  }

  async findAll(query: GetStudentsQueryDto) {
    return this.repo.getAllStudents({ query });
  }

  async findById(id: string) {
    const user = await this.repo.findById({ id });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.STUDENT_NOT_FOUND);

    const [scoreRow] = await this.db
      .select({ score: studentScores.score })
      .from(studentScores)
      .where(eq(studentScores.studentId, id))
      .limit(1);

    const classRows = await this.db
      .select()
      .from(classStudents)
      .where(eq(classStudents.studentId, id));

    const sessionRows = classRows[0]?.classId
      ? await this.db
          .select()
          .from(sessions)
          .where(eq(sessions.classId, classRows[0].classId))
          .limit(10)
      : [];

    const parent = user.parent;

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
      parentName: parent ? `${parent.firstName} ${parent.lastName}`.trim() : null,
      parentPhone: parent?.phone ?? null,
      parentEmail: parent?.email ?? null,
      parentRelationship: parent?.relationship ?? null,
      parent: parent
        ? {
            id: parent.id,
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            phone: parent.phone,
            relationship: parent.relationship,
            userCode: parent.userCode,
            avatar: parent.avatar,
          }
        : null,
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
    const student = await this.repo.findById({ id });
    if (!student) throw new NotFoundException(ERROR_MESSAGES.STUDENT_NOT_FOUND);

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

    let updated: Omit<typeof student, 'parent'> = student;
    if (Object.keys(studentUpdate).length > 0) {
      updated = (await this.repo.update({ id, data: studentUpdate })) ?? student;
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
          await this.repo.updateParent({ id: student.parentId, data: parentUpdate });
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
          gender: dto.parentRelationship === 'FATHER' ? 'MALE' : 'FEMALE',
          tutorId: student.tutorId,
        });
        updated = (await this.repo.update({ id, data: parent })) ?? student;
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
    const student = await this.repo.findById({ id });
    if (!student) throw new NotFoundException(ERROR_MESSAGES.STUDENT_NOT_FOUND);
    await this.repo.delete({ id });
    return { id };
  }
}
