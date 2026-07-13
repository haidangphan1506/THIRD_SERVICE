import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { and, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { grades, users } from '../../database/schema';
import {
  type ChangePasswordValues,
  type CreateUserInput,
  type GetUsersQueryDto,
  type UpdateGradeDto,
  type UpdateUserDto,
  type UpdateUserGradesDto,
  type UserDataFieldDto,
  User,
} from '@packages/entities/user';
import { checkUuidValid, compareData, hashData } from '@packages/helpers';
import { type MulterFile } from '../cloudinary/cloudinary.interface';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

function generateUserCode(): string {
  return randomBytes(3).toString('hex').slice(0, 6).toUpperCase();
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly searchableFields = ['id', 'email', 'username', 'phone', 'userCode'] as const;

  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
    private readonly cloudinaryService: CloudinaryService,
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
      `Cannot generate unique username for "${firstName} ${lastName}" after 10 attempts`,
    );
  }

  async getUsersService(query: GetUsersQueryDto): Promise<{
    data: Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, search, role, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search?.trim()) {
      const pattern = `%${search.trim()}%`;
      const searchCond = or(
        ilike(users.email, pattern),
        ilike(users.username, pattern),
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
      );
      if (searchCond) {
        conditions.push(searchCond);
      }
    }
    if (role !== undefined) {
      conditions.push(eq(users.role, role));
    }
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const [[totalRow], rows] = await Promise.all([
      this.db.select({ total: count() }).from(users).where(whereClause),
      this.db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(totalRow?.total ?? 0);
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
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    if (!user) {
      return null;
    }
    return user;
  }

  async getUserByField(userDataFieldDto: UserDataFieldDto): Promise<User[] | []> {
    if (
      !this.searchableFields.includes(
        userDataFieldDto.field as (typeof this.searchableFields)[number],
      )
    ) {
      this.logger.warn(`Status: 400 - Unsupported field: ${userDataFieldDto.field}`);
      throw new BadRequestException(`Unsupported field: ${userDataFieldDto.field}`);
    }

    const field = userDataFieldDto.field as (typeof this.searchableFields)[number];

    const columnMap = {
      id: users.id,
      email: users.email,
      username: users.username,
      phone: users.phone,
      userCode: users.userCode,
    } as const;

    const column = columnMap[field];
    if (!column) {
      throw new BadRequestException(`Unsupported field: ${field}`);
    }

    const user = await this.db.select().from(users).where(eq(column, userDataFieldDto.value));
    return user;
  }

  async createUserService(createUserDto: CreateUserInput): Promise<unknown> {
    this.logger.log(`Creating new user ...`);

    const { email, firstName, lastName, password, username } = createUserDto;
    let resolvedUsername = username?.trim();

    const [existingByEmail, existingByUsername] = await Promise.all([
      this.getUserByField({ field: 'email', value: email }),
      resolvedUsername && this.getUserByField({ field: 'username', value: resolvedUsername }),
    ]);

    if (existingByEmail.length > 0) {
      this.logger.warn(`Status: 400 - Email already exists: ${email}`);
      throw new BadRequestException(`Email already exists: ${email}`);
    }
    if (Array.isArray(existingByUsername) && existingByUsername.length > 0) {
      this.logger.warn(`Status: 400 - Username already exists: ${resolvedUsername}`);
      throw new BadRequestException(`Username already exists: ${resolvedUsername}`);
    }

    const id = randomUUID();
    const hashedPassword = await hashData(password);
    const role = createUserDto.role ?? 'STUDENT';
    let userCode: string | undefined;
    if (role === 'TUTOR') {
      userCode = generateUserCode();
      for (let i = 0; i < 5; i++) {
        const existing = await this.db
          .select()
          .from(users)
          .where(eq(users.userCode, userCode))
          .limit(1);
        if (existing.length === 0) break;
        userCode = generateUserCode();
      }
    }

    if (!username) {
      resolvedUsername = await this.generateUsername(firstName, lastName);
    }

    const user = await this.db
      .insert(users)
      .values({
        id,
        ...(userCode ? { userCode } : {}),
        email,
        username: resolvedUsername!,
        firstName,
        lastName,
        password: hashedPassword,
        role,
      })
      .returning();
    return user[0];
  }

  async updateUserPasswordService({ id, password }: { id: string; password: string }) {
    const hashedPassword = await hashData(password);
    const updatedUser = await this.db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return updatedUser[0];
  }

  async updateUserService({ id, data }: { id: string; data: UpdateUserDto }) {
    const user = await this.getUserByField({
      field: 'id',
      value: id,
    });
    if (Array.isArray(user) && !user.length) {
      throw new BadRequestException('User not found ...');
    }

    const [updatedUser] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateStatusUserService({ id }: { id: string }) {
    const user = await this.getUserByField({
      field: 'id',
      value: id,
    });
    if (Array.isArray(user) && !user.length) {
      throw new BadRequestException('User not found ...');
    }

    const updatedUser = await this.db
      .update(users)
      .set({ isActive: !user[0].isActive })
      .where(eq(users.id, id))
      .returning();
    return updatedUser[0];
  }

  async deleteUserByAdminService({ id }: { id: string }) {
    const user = await this.getUserByField({
      field: 'id',
      value: id,
    });
    if (Array.isArray(user) && !user.length) {
      throw new BadRequestException('User not found ...');
    }
    await this.db.delete(users).where(eq(users.id, id));
    return { id: id };
  }

  async getGradesService(userId: string) {
    const [user] = await this.db
      .select({ gradesId: users.gradesId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.gradesId?.length) {
      return [];
    }

    return this.db
      .select()
      .from(grades)
      .where(inArray(grades.id, user.gradesId))
      .orderBy(grades.level);
  }

  async updateGradeService(id: string, dto: UpdateGradeDto) {
    const [existing] = await this.db.select().from(grades).where(eq(grades.id, id)).limit(1);
    if (!existing) {
      throw new BadRequestException('Grade not found');
    }
    const [updated] = await this.db
      .update(grades)
      .set({ name: dto.name, level: dto.level })
      .where(eq(grades.id, id))
      .returning();
    return updated;
  }

  async updateUserGradesService(userId: string, dto: UpdateUserGradesDto) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const validGrades = await this.db
      .select({ id: grades.id })
      .from(grades)
      .where(inArray(grades.id, dto.gradesId));

    if (validGrades.length !== dto.gradesId.length) {
      throw new BadRequestException('One or more grade IDs are invalid');
    }

    const [updated] = await this.db
      .update(users)
      .set({ gradesId: dto.gradesId })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async changePasswordService(userId: string, dto: ChangePasswordValues) {
    const [user] = await this.db
      .select({ id: users.id, password: users.password })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isMatch = await compareData(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.updateUserPasswordService({ id: userId, password: dto.newPassword });
    return { message: 'Password changed successfully' };
  }

  async uploadAvatarService(userId: string, file: MulterFile) {
    if (!userId || (userId && !checkUuidValid({ data: userId }))) {
      throw new BadRequestException('UserId not found ...');
    }
    const result = await this.cloudinaryService.upload(file);

    await this.db.update(users).set({ avatar: result.secure_url }).where(eq(users.id, userId));

    return { avatar: result.secure_url };
  }
}
