import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import {
  getUserDetailQuerySchema,
  getUsersQuerySchema,
  type CreateUserDto,
  type CreateUserResponseDto,
  createUserSchema,
  dataFieldSchema,
  type GetUsersQueryDto,
  type UserDataFieldDto,
} from '@packages/entities/user';
import { ApiResponse, CurrentUser } from '@packages/decorators';
import { JwtAuthGuard } from '@packages/guards';
import { ZodValidationPipe } from '@packages/pipes';
import { type GetDetailUserQuery, UserService } from './user.service';
type GetUsersResponse = Awaited<ReturnType<UserService['getUsersService']>>;

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users', description: 'Get a paginated list of users (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Alias for limit' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['ADMIN', 'TUTOR', 'PARENT', 'STUDENT'],
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    enum: ['true', 'false'],
    description: 'Filter by active status',
  })
  @SwaggerResponse({ status: 200, description: 'Users fetched successfully' })
  async getUsers(
    @Query(new ZodValidationPipe<GetUsersQueryDto>(getUsersQuerySchema))
    query: GetUsersQueryDto,
  ): Promise<GetUsersResponse> {
    return await this.userService.getUsersService(query);
  }

  @Get('/detail-user')
  @ApiOperation({
    summary: 'Get current user detail',
    description:
      'Get detailed info about the authenticated user, optionally including wallets, transactions, categories',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    type: String,
    description: 'Comma-separated: wallets,transactions,categories',
    example: 'wallets,transactions',
  })
  @ApiQuery({
    name: 'transactionLimit',
    required: false,
    type: Number,
    example: 50,
    description: 'Max transactions to return',
  })
  @SwaggerResponse({ status: 200, description: 'User detail fetched successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Get detail user successfully ...' })
  async getDetailUserController(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<GetDetailUserQuery>(getUserDetailQuerySchema))
    detailQuery: GetDetailUserQuery,
  ) {
    this.logger.log('Data user :', user);
    return await this.userService.getDetailUserService({ id: user.id, query: detailQuery });
  }

  @Get('/get-by-field')
  @ApiOperation({
    summary: 'Find user by field',
    description: 'Look up a user by specifying a field and value',
  })
  @ApiQuery({
    name: 'field',
    required: true,
    type: String,
    description: 'Field name (e.g. email, username, userCode)',
    example: 'email',
  })
  @ApiQuery({
    name: 'value',
    required: true,
    type: String,
    description: 'Field value to search',
    example: 'user@example.com',
  })
  @SwaggerResponse({ status: 200, description: 'User fetched successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'User fetched successfully' })
  async getUserByField(
    @Query(new ZodValidationPipe(dataFieldSchema))
    dataFieldDto: UserDataFieldDto,
  ): Promise<unknown> {
    return await this.userService.getUserByField(dataFieldDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create user', description: 'Create a new user (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'firstName', 'lastName', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'newuser@example.com' },
        username: { type: 'string', example: 'newuser' },
        firstName: { type: 'string', minLength: 2, maxLength: 100, example: 'Jane' },
        lastName: { type: 'string', minLength: 2, maxLength: 100, example: 'Smith' },
        password: { type: 'string', minLength: 8, maxLength: 14, example: 'Pass1234!' },
        role: { type: 'string', enum: ['ADMIN', 'TUTOR', 'PARENT', 'STUDENT'], default: 'STUDENT' },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'User created successfully' })
  async createUser(
    @Body(new ZodValidationPipe(createUserSchema))
    createUserDto: CreateUserDto,
  ): Promise<CreateUserResponseDto> {
    return (await this.userService.createUserService(createUserDto)) as CreateUserResponseDto;
  }

  @Put('')
  @ApiOperation({
    summary: 'Update current user',
    description: 'Update the authenticated user profile',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'updated@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        avatar: { type: 'string', nullable: true },
        phone: { type: 'string', nullable: true },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Update user successfully ...' })
  async updateUserController(
    @CurrentUser() user: Record<string, string>,
    @Body() updateUserDto: Record<string, string>,
  ) {
    return await this.userService.updateUserService({ id: user.id, data: updateUserDto });
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update user by admin',
    description: 'Update any user by ID (admin only)',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string', enum: ['ADMIN', 'TUTOR', 'PARENT', 'STUDENT'] },
        isActive: { type: 'boolean' },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Update user successfully ...' })
  async updateUserByAdminController(
    @Param('id') id: string,
    @Body() updateUserDto: Record<string, string>,
  ) {
    return await this.userService.updateUserService({ id: id, data: updateUserDto });
  }

  @Put('/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Toggle user status',
    description: 'Activate or deactivate a user (admin only)',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'User ID' })
  @SwaggerResponse({ status: 200, description: 'User status updated' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Update user status successfully ...' })
  async updateStatusUserController(@Param('id') id: string) {
    return await this.userService.updateStatusUserService({ id: id });
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete user', description: 'Delete a user by ID (admin only)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'User ID' })
  @SwaggerResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Delete user successfully ...' })
  async deleteUserByAdminController(@Param('id') id: string) {
    return await this.userService.deleteUserByAdminService({ id: id });
  }
}
