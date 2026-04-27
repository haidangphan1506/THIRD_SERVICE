import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, count, eq, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';
import { DRIZZLE } from '../../database/database.module';
import { users } from '../../database/schema';
import {
  type CreateUserDto,
  type CreateUserResponseDto,
  type GetUsersQueryDto,
  type UserListResponseDto,
} from '../../entities/user';
import { buildPaginationMeta, buildSearchCondition, getPaginationParams } from '../../helpers';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async getUsersService(query: GetUsersQueryDto): Promise<UserListResponseDto> {
    this.logger.log(`Getting users with query: ${JSON.stringify(query)}`);

    const { page, limit, search, isActive, role } = query;
    const pagination = getPaginationParams(page, limit);

    const filters: SQL[] = [];

    if (typeof isActive === 'boolean') {
      filters.push(eq(users.isActive, isActive));
    }
    if (role) {
      filters.push(eq(users.role, role));
    }

    const searchCondition = buildSearchCondition(search, [
      users.email,
      users.username,
      users.firstName,
      users.lastName,
    ]);
    if (searchCondition) {
      filters.push(searchCondition);
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [userRows, totalRows] = await Promise.all([
      this.db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          phone: users.phone,
          isActive: users.isActive,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .limit(pagination.limit)
        .offset(pagination.offset),
      this.db.select({ total: count() }).from(users).where(whereClause),
    ]);

    const total = totalRows[0]?.total ?? 0;

    return {
      message: 'Users list',
      query: { ...query, page: pagination.page, limit: pagination.limit },
      meta: buildPaginationMeta(total, pagination.page, pagination.limit),
      data: userRows,
    };
  }

  async createUserService(payload: CreateUserDto): Promise<CreateUserResponseDto> {
    this.logger.log(`Creating user: ${payload.email}`);

    const [firstName = payload.fullName, ...rest] = payload.fullName.split(' ');
    const lastName = rest.join(' ') || firstName;
    const baseUsername = payload.email.split('@')[0] ?? 'user';
    const username = `${baseUsername}_${Date.now()}`;
    const hashedPassword = await bcrypt.hash(payload.password, 12);

    try {
      await this.db.insert(users).values({
        email: payload.email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
      });
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError.code === '23505') {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }

    return {
      message: 'User created',
      data: {
        ...payload,
        password: '[hidden]',
      },
    };
  }
}
