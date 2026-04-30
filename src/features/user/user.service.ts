import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { users } from '../../database/schema';
import {
  type UserDataFieldDto,
  type CreateUserDto,
  type GetUsersQueryDto,
} from '../../entities/user';
import { hashData } from 'src/helpers';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly searchableFields = ['id', 'email', 'username', 'phone'] as const;

  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  getUsersService(query: GetUsersQueryDto) {
    return query;
  }

  async getUserByField(userDataFieldDto: UserDataFieldDto): Promise<unknown> {
    if (
      !this.searchableFields.includes(
        userDataFieldDto.field as (typeof this.searchableFields)[number],
      )
    ) {
      this.logger.warn(`Status: 400 - Unsupported field: ${userDataFieldDto.field}`);
      throw new BadRequestException(`Unsupported field: ${userDataFieldDto.field}`);
    }

    const field = userDataFieldDto.field as (typeof this.searchableFields)[number];

    return await this.db.select().from(users).where(eq(users[field], userDataFieldDto.value));
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

    const makeUuid = uuidv4 as unknown as () => string;
    const id = makeUuid();
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
    this.logger.log(`user created successfully: ${JSON.stringify(user[0]?.id)}`);
    return user[0];
  }
}
