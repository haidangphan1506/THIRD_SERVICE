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
import { categories, grades, transactions, users, wallets } from '../../database/schema';
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

/** Khớp `getUserDetailQuerySchema` — tách riêng để tránh inference lỗi với `z.preprocess`. */
export type GetDetailUserQuery = {
  include: Array<'wallets' | 'transactions' | 'categories'>;
  transactionLimit: number;
};

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
      walletCount: number;
      transactionCount: number;
      categoryCount: number;
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

    const ids = rows.map((r) => r.id);

    const walletMap = new Map<string, number>();
    const transactionMap = new Map<string, number>();
    const categoryCountMap = new Map<string, number>();

    if (ids.length > 0) {
      const [walletAgg, txAgg, txDistinctCats, walletCatRows] = await Promise.all([
        this.db
          .select({ userId: wallets.userId, n: count() })
          .from(wallets)
          .where(inArray(wallets.userId, ids))
          .groupBy(wallets.userId),
        this.db
          .select({ userId: transactions.userId, n: count() })
          .from(transactions)
          .where(inArray(transactions.userId, ids))
          .groupBy(transactions.userId),
        this.db
          .selectDistinct({ userId: transactions.userId, categoryId: transactions.categoryId })
          .from(transactions)
          .where(inArray(transactions.userId, ids)),
        this.db
          .select({ userId: wallets.userId, categoriesId: wallets.categoriesId })
          .from(wallets)
          .where(inArray(wallets.userId, ids)),
      ]);

      for (const w of walletAgg) {
        walletMap.set(w.userId, Number(w.n));
      }
      for (const t of txAgg) {
        transactionMap.set(t.userId, Number(t.n));
      }

      const categoryIdsByUser = new Map<string, Set<string>>();
      for (const id of ids) {
        categoryIdsByUser.set(id, new Set());
      }
      for (const r of txDistinctCats) {
        if (r.categoryId) {
          categoryIdsByUser.get(r.userId)?.add(String(r.categoryId));
        }
      }
      for (const r of walletCatRows) {
        const set = categoryIdsByUser.get(r.userId);
        if (!set) {
          continue;
        }
        for (const cid of r.categoriesId ?? []) {
          if (cid) {
            set.add(String(cid));
          }
        }
      }
      for (const [uid, set] of categoryIdsByUser) {
        categoryCountMap.set(uid, set.size);
      }
    }

    const data = rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: `${row.firstName} ${row.lastName}`.trim(),
      role: row.role ?? 'STUDENT',
      status: row.isActive === true ? 'active' : 'inactive',
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      walletCount: walletMap.get(row.id) ?? 0,
      transactionCount: transactionMap.get(row.id) ?? 0,
      categoryCount: categoryCountMap.get(row.id) ?? 0,
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

  async getDetailUserService({ id, query }: { id: string; query?: GetDetailUserQuery }): Promise<
    | (User & {
        wallets?: Array<Record<string, unknown>>;
        transactions?: Array<Record<string, unknown>>;
        categories?: Array<Record<string, unknown>>;
      })
    | null
  > {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    if (!user) {
      return null;
    }

    const include = new Set(query?.include ?? []);
    if (include.size === 0) {
      return user;
    }

    const transactionLimit = query?.transactionLimit ?? 50;
    const payload: User & {
      wallets?: Array<Record<string, unknown>>;
      transactions?: Array<Record<string, unknown>>;
      categories?: Array<Record<string, unknown>>;
    } = { ...user };

    const tasks: Promise<void>[] = [];

    if (include.has('wallets')) {
      tasks.push(
        this.db
          .select()
          .from(wallets)
          .where(eq(wallets.userId, id))
          .then((walletRows) => {
            payload.wallets = walletRows.map((w) => ({
              ...w,
              balance: w.balance != null ? String(w.balance) : '0',
              createdAt:
                w.createdAt instanceof Date ? w.createdAt.toISOString() : String(w.createdAt),
              updatedAt:
                w.updatedAt instanceof Date ? w.updatedAt.toISOString() : String(w.updatedAt),
            }));
          }),
      );
    }

    if (include.has('transactions')) {
      tasks.push(
        this.db
          .select({
            id: transactions.id,
            name: transactions.name,
            userId: transactions.userId,
            walletId: transactions.walletId,
            categoryId: transactions.categoryId,
            amount: transactions.amount,
            note: transactions.note,
            type: transactions.type,
            status: transactions.status,
            createdAt: transactions.createdAt,
            updatedAt: transactions.updatedAt,
            categoryName: categories.name,
            categoryType: categories.type,
            walletName: wallets.name,
          })
          .from(transactions)
          .innerJoin(categories, eq(transactions.categoryId, categories.id))
          .innerJoin(wallets, eq(transactions.walletId, wallets.id))
          .where(eq(transactions.userId, id))
          .orderBy(desc(transactions.createdAt))
          .limit(transactionLimit)
          .then((txRows) => {
            payload.transactions = txRows.map((row) => ({
              id: row.id,
              name: row.name,
              userId: row.userId,
              walletId: row.walletId,
              categoryId: row.categoryId,
              amount: row.amount != null ? String(row.amount) : '0',
              note: row.note,
              type: row.type,
              avatar: user.avatar ?? '',
              status: row.status,
              createdAt:
                row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
              updatedAt:
                row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
              category: {
                id: row.categoryId,
                name: row.categoryName,
                type: row.categoryType,
              },
              wallet: {
                id: row.walletId,
                name: row.walletName,
              },
            }));
          }),
      );
    }

    if (include.has('categories')) {
      tasks.push(
        (async () => {
          const fromTransactions = await this.db
            .selectDistinct({
              id: categories.id,
              name: categories.name,
              type: categories.type,
              parentId: categories.parentId,
              icon: categories.icon,
              color: categories.color,
              createdAt: categories.createdAt,
              updatedAt: categories.updatedAt,
            })
            .from(transactions)
            .innerJoin(categories, eq(transactions.categoryId, categories.id))
            .where(eq(transactions.userId, id));

          const txCategoryIds = new Set(fromTransactions.map((c) => String(c.id)));

          const walletCategoryIdRows = await this.db
            .select({ categoriesId: wallets.categoriesId })
            .from(wallets)
            .where(eq(wallets.userId, id));

          const walletOnlyCategoryIds = new Set<string>();
          for (const row of walletCategoryIdRows) {
            for (const cid of row.categoriesId ?? []) {
              if (!cid) {
                continue;
              }
              const sid = String(cid);
              if (!txCategoryIds.has(sid)) {
                walletOnlyCategoryIds.add(sid);
              }
            }
          }

          const fromWalletRefs =
            walletOnlyCategoryIds.size > 0
              ? await this.db
                  .selectDistinct({
                    id: categories.id,
                    name: categories.name,
                    type: categories.type,
                    parentId: categories.parentId,
                    icon: categories.icon,
                    color: categories.color,
                    createdAt: categories.createdAt,
                    updatedAt: categories.updatedAt,
                  })
                  .from(categories)
                  .where(inArray(categories.id, [...walletOnlyCategoryIds]))
              : [];

          type CatRow = (typeof fromTransactions)[number];
          const byId = new Map<string, Record<string, unknown>>();
          const pushCat = (c: CatRow) => {
            byId.set(String(c.id), {
              id: c.id,
              name: c.name,
              type: c.type,
              parentId: c.parentId,
              icon: c.icon,
              color: c.color,
              createdAt:
                c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
              updatedAt:
                c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
            });
          };
          for (const c of fromTransactions) {
            pushCat(c);
          }
          for (const c of fromWalletRefs) {
            if (!byId.has(String(c.id))) {
              pushCat(c);
            }
          }
          payload.categories = [...byId.values()];
        })(),
      );
    }

    await Promise.all(tasks);
    return payload;
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
