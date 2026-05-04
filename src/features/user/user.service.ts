import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { users } from '../../database/schema';
import {
  type UserDataFieldDto,
  type CreateUserDto,
  type GetUsersQueryDto,
  User,
} from '@packages/entities/user';
import { hashData } from '@packages/helpers';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly searchableFields = ['id', 'email', 'username', 'phone'] as const;

  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

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

    const whereClause = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);

    const [totalRow] = await this.db.select({ total: count() }).from(users).where(whereClause);
    const total = Number(totalRow?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const rows = await this.db
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
      .offset(offset);

    const data = rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: `${row.firstName} ${row.lastName}`.trim(),
      role: row.role ?? 'USER',
      status: row.isActive === true ? 'active' : 'inactive',
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
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

    return await this.db.select().from(users).where(eq(users[field], userDataFieldDto.value)) as User[] | [];
  }

  async createUserService(createUserDto: CreateUserDto): Promise<unknown> {
    this.logger.log(`Creating new user ...`);

    const { email, firstName, lastName, password } = createUserDto;

    const isUserExistsByEmail = await this.getUserByField({ field: 'email', value: email });
    this.logger.log(`isUserExistsByEmail: ${JSON.stringify(isUserExistsByEmail)}`);
    if (
      !isUserExistsByEmail ||
      (Array.isArray(isUserExistsByEmail) && isUserExistsByEmail.length > 0)
    ) {
      this.logger.warn(`Status: 400 - Email already exists: ${email}`);
      throw new BadRequestException(`Email already exists: ${email}`);
    }

    const isUserExistsByUsername = await this.getUserByField({
      field: 'username',
      value: email.split('@')[0],
    });
    if (
      !isUserExistsByUsername ||
      (Array.isArray(isUserExistsByUsername) && isUserExistsByUsername.length > 0)
    ) {
      this.logger.warn(`Status: 400 - Username already exists: ${email.split('@')[0]}`);
      throw new BadRequestException(`Username already exists: ${email.split('@')[0]}`);
    }

    const id = randomUUID();
    const hashedPassword = await hashData(password);

    const user = await this.db
      .insert(users)
      .values({
        id,
        email,
        username: email.split('@')[0],
        firstName,
        lastName,
        password: hashedPassword,
      })
      .returning();
    return user[0];
  }
}
