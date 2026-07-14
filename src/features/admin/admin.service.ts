import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateManagedUserDto,
  ListManagedUsersQueryDto,
  UpdateManagedUserDto,
} from '@packages/entities/admin';
import { checkUuidValid, generateCode, hashData } from '@packages/helpers';
import { AdminRepository, type ManagedRole } from './admin.repository';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly adminRepository: AdminRepository) {}

  // ─── Tutors ────────────────────────────────────────────────────────
  createTutor(dto: CreateManagedUserDto) {
    return this.createManagedUser(dto, 'TUTOR');
  }

  listTutors(query: ListManagedUsersQueryDto) {
    return this.listManagedUsers('TUTOR', query);
  }

  getTutor(id: string) {
    return this.getManagedUser(id, 'TUTOR');
  }

  updateTutor(id: string, dto: UpdateManagedUserDto) {
    return this.updateManagedUser(id, 'TUTOR', dto);
  }

  deleteTutor(id: string) {
    return this.deleteManagedUser(id, 'TUTOR');
  }

  // ─── Students ──────────────────────────────────────────────────────
  createStudent(dto: CreateManagedUserDto) {
    return this.createManagedUser(dto, 'STUDENT');
  }

  listStudents(query: ListManagedUsersQueryDto) {
    return this.listManagedUsers('STUDENT', query);
  }

  getStudent(id: string) {
    return this.getManagedUser(id, 'STUDENT');
  }

  updateStudent(id: string, dto: UpdateManagedUserDto) {
    return this.updateManagedUser(id, 'STUDENT', dto);
  }

  deleteStudent(id: string) {
    return this.deleteManagedUser(id, 'STUDENT');
  }

  // ─── Shared implementation ─────────────────────────────────────────
  private async createManagedUser(dto: CreateManagedUserDto, role: ManagedRole) {
    this.logger.log(`Admin creating a ${role} account (${dto.email})`);

    const email = dto.email.trim().toLowerCase();
    const [existingByEmail] = await this.adminRepository.findByEmail(email);
    if (existingByEmail) {
      throw new ConflictException(`Email already exists: ${email}`);
    }

    const username = dto.username?.trim()
      ? await this.ensureUniqueUsername(dto.username.trim())
      : await this.generateUsername(dto.firstName, dto.lastName);

    const userCode = role === 'TUTOR' ? await this.generateUniqueUserCode() : undefined;
    const hashedPassword = await hashData(dto.password);

    const created = await this.adminRepository.create({
      id: randomUUID(),
      email,
      username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashedPassword,
      phone: dto.phone,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth,
      school: dto.school,
      subjects: this.joinSubjects(dto.subjects),
      description: dto.description,
      isActive: dto.isActive,
      role,
      ...(userCode ? { userCode } : {}),
    });
    return this.mapRow(created);
  }

  private async listManagedUsers(role: ManagedRole, query: ListManagedUsersQueryDto) {
    const { rows, pagination } = await this.adminRepository.list({ role, ...query });
    const key = role === 'TUTOR' ? 'tutors' : 'students';
    return { [key]: rows.map((row) => this.mapRow(row)), pagination };
  }

  private async getManagedUser(id: string, role: ManagedRole) {
    this.assertUuid(id);
    const row = await this.adminRepository.findByIdAndRole(id, role);
    if (!row) {
      throw new NotFoundException(`${this.label(role)} not found`);
    }
    return this.mapRow(row);
  }

  private async updateManagedUser(id: string, role: ManagedRole, dto: UpdateManagedUserDto) {
    this.assertUuid(id);
    await this.getManagedUser(id, role);

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const [existing] = await this.adminRepository.findByEmail(email);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email already exists: ${email}`);
      }
      dto = { ...dto, email };
    }
    if (dto.username) {
      const [existing] = await this.adminRepository.findByUsername(dto.username.trim());
      if (existing && existing.id !== id) {
        throw new ConflictException(`Username already exists: ${dto.username.trim()}`);
      }
    }

    const { subjects, ...rest } = dto;
    const writeData = {
      ...rest,
      // `subjects` arrives as string[] but the column stores a comma-joined string;
      // an empty array or null clears it.
      ...(subjects !== undefined
        ? { subjects: subjects && subjects.length ? this.joinSubjects(subjects) : null }
        : {}),
    };

    const updated = await this.adminRepository.updateByIdAndRole(id, role, writeData);
    if (!updated) {
      throw new NotFoundException(`${this.label(role)} not found`);
    }
    return this.mapRow(updated);
  }

  private async deleteManagedUser(id: string, role: ManagedRole) {
    this.assertUuid(id);
    const deleted = await this.adminRepository.deleteByIdAndRole(id, role);
    if (!deleted) {
      throw new NotFoundException(`${this.label(role)} not found`);
    }
    return { id: deleted.id };
  }

  // ─── Helpers ───────────────────────────────────────────────────────
  private assertUuid(id: string) {
    if (!checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid id ...');
    }
  }

  private label(role: ManagedRole): string {
    return role === 'TUTOR' ? 'Tutor' : 'Student';
  }

  /** The DB column stores subjects as a comma-joined string; the API exposes an array. */
  private joinSubjects(subjects?: string[]): string | undefined {
    if (!subjects || subjects.length === 0) return undefined;
    return subjects.map((s) => s.trim()).filter(Boolean).join(', ');
  }

  private splitSubjects(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** Turn a raw DB row into the API shape (subjects string → string[]). */
  private mapRow<T extends { subjects: string | null }>(row: T): Omit<T, 'subjects'> & {
    subjects: string[];
  } {
    return { ...row, subjects: this.splitSubjects(row.subjects) };
  }

  private async ensureUniqueUsername(username: string): Promise<string> {
    const [existing] = await this.adminRepository.findByUsername(username);
    if (existing) {
      throw new ConflictException(`Username already exists: ${username}`);
    }
    return username;
  }

  private async generateUsername(firstName: string, lastName: string): Promise<string> {
    const base = `${lastName}${firstName}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '');

    for (let i = 0; i < 10; i++) {
      const candidate = i === 0 ? base : `${base}${i}`;
      const [existing] = await this.adminRepository.findByUsername(candidate);
      if (!existing) return candidate;
    }
    throw new ConflictException(
      `Cannot generate unique username for "${firstName} ${lastName}" after 10 attempts`,
    );
  }

  private async generateUniqueUserCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = generateCode(6);
      const [existing] = await this.adminRepository.findByUserCode(code);
      if (!existing) return code;
    }
    throw new ConflictException('Cannot generate a unique user code after 5 attempts');
  }
}
