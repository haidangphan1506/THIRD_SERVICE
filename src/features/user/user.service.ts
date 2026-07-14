import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { UserRepository } from './user.repository';
import type {
  ChangePasswordValues,
  CreateUserInput,
  CreateUserResponseDto,
  GetUsersQueryDto,
  UpdateGradeDto,
  UpdateUserDto,
  UpdateUserGradesDto,
  UserDataFieldDto,
  User,
} from '@packages/entities/user';
import { checkUuidValid, compareData, hashData } from '@packages/helpers';
import { MulterFile, UploadResponse } from '../uploads/upload.interface';
import { ERROR_MESSAGES } from 'src/data/constants';
import { UploadService } from '../uploads/upload.service';

function generateUserCode(): string {
  return randomBytes(3).toString('hex').slice(0, 6).toUpperCase();
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly searchableFields = ['id', 'email', 'username', 'phone', 'userCode'] as const;

  constructor(
    private readonly userRepo: UserRepository,
    private readonly upload: UploadService,
  ) {}

  async generateUsername(firstName: string, lastName: string): Promise<string> {
    const baseUsername = `${lastName}${firstName}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');

    for (let i = 0; i < 10; i++) {
      const candidate = i === 0 ? baseUsername : `${baseUsername}${i}`;
      const existing = await this.getUserByField({ field: 'username', value: candidate });
      if (existing.length === 0) return candidate;
    }

    throw new ConflictException(
      `${ERROR_MESSAGES.UNABLE_TO_GENERATE_USERNAME} for "${firstName} ${lastName}" after 10 attempts`,
    );
  }

  async getUsersService(query: GetUsersQueryDto) {
    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const whereClause = this.userRepo.buildUserListConditions(query);

    const [total, rows] = await Promise.all([
      this.userRepo.countUsers(whereClause),
      this.userRepo.paginateUsers(whereClause, limit, offset),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const data = rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: `${row.firstName} ${row.lastName}`.trim(),
      role: row.role ?? 'STUDENT',
      status: row.isActive === true ? 'active' : 'inactive',
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    }));

    return {
      data,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages,
      },
    };
  }

  async getDetailUserService({ id }: { id: string }): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  async getUserByField(userDataFieldDto: UserDataFieldDto): Promise<User[]> {
    if (
      !this.searchableFields.includes(
        userDataFieldDto.field as (typeof this.searchableFields)[number],
      )
    ) {
      this.logger.warn(`Status: 400 - Unsupported field: ${userDataFieldDto.field}`);
      throw new BadRequestException(`${ERROR_MESSAGES.UNSUPPORTED_FIELD}: ${userDataFieldDto.field}`);
    }

    return this.userRepo.findByField(userDataFieldDto.field, userDataFieldDto.value);
  }

  async createUserService(createUserDto: CreateUserInput): Promise<CreateUserResponseDto> {
    this.logger.log(`Creating new user ...`);

    const { email, firstName, lastName, password, username } = createUserDto;
    let resolvedUsername = username?.trim();

    const [existingByEmail, existingByUsername] = await Promise.all([
      this.getUserByField({ field: 'email', value: email }),
      resolvedUsername && this.getUserByField({ field: 'username', value: resolvedUsername }),
    ]);

    if (existingByEmail.length > 0) {
      this.logger.warn(`Status: 400 - Email already exists: ${email}`);
      throw new BadRequestException(`${ERROR_MESSAGES.EMAIL_EXISTS}: ${email}`);
    }
    if (Array.isArray(existingByUsername) && existingByUsername.length > 0) {
      this.logger.warn(`Status: 400 - Username already exists: ${resolvedUsername}`);
      throw new BadRequestException(`${ERROR_MESSAGES.USERNAME_EXISTS}: ${resolvedUsername}`);
    }

    const id = randomUUID();
    const hashedPassword = await hashData(password);
    const role = createUserDto.role ?? 'STUDENT';
    let userCode: string | undefined;
    if (role === 'TUTOR') {
      userCode = generateUserCode();
      for (let i = 0; i < 5; i++) {
        const existing = await this.userRepo.findUserCode(userCode);
        if (!existing) break;
        userCode = generateUserCode();
      }
    }

    if (!username) {
      resolvedUsername = await this.generateUsername(firstName, lastName);
    }

    const user = await this.userRepo.create({
      id,
      ...(userCode ? { userCode } : {}),
      email,
      username: resolvedUsername!,
      firstName,
      lastName,
      password: hashedPassword,
      role,
    });

    return {
      message: 'User created successfully',
      data: {
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        password: user.password,
      },
    };
  }

  async updateUserPasswordService({ id, password }: { id: string; password: string }) {
    const hashedPassword = await hashData(password);
    return this.userRepo.updatePassword(id, hashedPassword);
  }

  async updateUserService({ id, data }: { id: string; data: UpdateUserDto }) {
    const user = await this.getUserByField({ field: 'id', value: id });
    if (Array.isArray(user) && !user.length) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return this.userRepo.update(id, data);
  }

  async updateStatusUserService({ id }: { id: string }) {
    const user = await this.getUserByField({ field: 'id', value: id });
    if (Array.isArray(user) && !user.length) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return this.userRepo.update(id, { isActive: !user[0].isActive });
  }

  async deleteUserByAdminService({ id }: { id: string }) {
    const user = await this.getUserByField({ field: 'id', value: id });
    if (Array.isArray(user) && !user.length) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    await this.userRepo.delete(id);
    return { id };
  }

  async getGradesService(userId: string) {
    return this.userRepo.findGradesByUser(userId);
  }

  async updateGradeService(id: string, dto: UpdateGradeDto) {
    const existing = await this.userRepo.findGradeById(id);
    if (!existing) {
      throw new BadRequestException(ERROR_MESSAGES.GRADE_NOT_FOUND);
    }
    return this.userRepo.updateGrade(id, dto);
  }

  async updateUserGradesService(userId: string, dto: UpdateUserGradesDto) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const validGrades = await this.userRepo.validateGradeIds(dto.gradesId);
    if (validGrades.length !== dto.gradesId.length) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_GRADE_IDS);
    }

    return this.userRepo.update(userId, { gradesId: dto.gradesId });
  }

  async changePasswordService(userId: string, dto: ChangePasswordValues) {
    const user = await this.userRepo.findWithPassword(userId);
    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isMatch = await compareData(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException(ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT);
    }

    await this.updateUserPasswordService({ id: userId, password: dto.newPassword });
    return { message: 'Password changed successfully' };
  }

  async uploadAvatarService(userId: string, file: MulterFile) {
    if (!userId || (userId && !checkUuidValid({ data: userId })))
      throw new BadRequestException(ERROR_MESSAGES.USER_ID_MUST_BE_UUID);

    const user = await this.userRepo.findById(userId);
    if (!user) throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);

    const result: UploadResponse = await this.upload.upload(file, 'avatars');

    if (result?.url) {
      await this.userRepo.update(userId, { avatar: result.url });
    }

    return result;
  }
}
