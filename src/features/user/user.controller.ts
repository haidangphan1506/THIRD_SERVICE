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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { StatusCodes } from 'http-status-codes';
import {
  changePasswordSchema,
  getUsersQuerySchema,
  type ChangePasswordValues,
  type CreateUserDto,
  type CreateUserResponseDto,
  createUserSchema,
  dataFieldSchema,
  type GetUsersQueryDto,
  type UpdateGradeDto,
  updateGradeSchema,
  type UpdateUserDto,
  updateUserSchema,
  type UpdateUserGradesDto,
  updateUserGradesSchema,
  type UserDataFieldDto,
} from '@packages/entities/user';
import { ApiResponse, CurrentUser, Roles } from '@packages/decorators';
import { JwtAuthGuard, RolesGuard } from '@packages/guards';
import { ZodValidationPipe } from '@packages/pipes';
import { type MulterFile } from '../cloudinary/cloudinary.interface';
import { UserService } from './user.service';
type GetUsersResponse = Awaited<ReturnType<UserService['getUsersService']>>;

const UPDATE_USER_BODY_SCHEMA = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', example: 'updated@example.com' },
    username: { type: 'string', maxLength: 50, example: 'newusername' },
    firstName: { type: 'string', minLength: 2, maxLength: 100, example: 'John' },
    lastName: { type: 'string', minLength: 2, maxLength: 100, example: 'Doe' },
    avatar: {
      type: 'string',
      format: 'uri',
      nullable: true,
      example: 'https://cdn.example.com/avatar.png',
    },
    phone: { type: 'string', maxLength: 20, nullable: true, example: '+84901234567' },
    isActive: { type: 'boolean', example: true },
    role: { type: 'string', enum: ['ADMIN', 'TUTOR', 'PARENT', 'STUDENT'], example: 'STUDENT' },
    description: { type: 'string', maxLength: 5000, nullable: true, example: 'Short bio' },
    userCode: { type: 'string', maxLength: 6, nullable: true, example: 'ABC123' },
    gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], nullable: true, example: 'MALE' },
    dateOfBirth: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      example: '2000-01-15T00:00:00.000Z',
    },
    address: { type: 'string', nullable: true, example: '123 Nguyen Trai' },
    district: { type: 'string', maxLength: 30, nullable: true, example: 'District 1' },
    province: { type: 'string', maxLength: 30, nullable: true, example: 'Ho Chi Minh' },
    subjects: { type: 'string', maxLength: 30, nullable: true, example: 'Toán, Vật lý' },
    facebookId: {
      type: 'string',
      maxLength: 200,
      nullable: true,
      example: 'https://facebook.com/john',
    },
    googleId: {
      type: 'string',
      maxLength: 200,
      nullable: true,
      example: 'https://google.com/john',
    },
    school: {
      type: 'string',
      maxLength: 255,
      nullable: true,
      example: 'Le Hong Phong High School',
    },
    relationship: { type: 'string', maxLength: 50, nullable: true, example: 'FATHER' },
    classId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    },
    gradesId: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
    },
    parentId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    },
    tutorId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    },
  },
};

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
    description: 'Get detailed info about the authenticated user',
  })
  @SwaggerResponse({ status: 200, description: 'User detail fetched successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Get detail user successfully ...' })
  async getDetailUserController(@CurrentUser() user: Record<string, string>) {
    this.logger.log('Data user :', user);
    return await this.userService.getDetailUserService({ id: user.id });
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
    description: 'Update the authenticated user profile. All fields are optional.',
  })
  @ApiBody({ schema: UPDATE_USER_BODY_SCHEMA })
  @SwaggerResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Update user successfully ...' })
  async updateUserController(
    @CurrentUser() user: Record<string, string>,
    @Body(new ZodValidationPipe<UpdateUserDto>(updateUserSchema))
    updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUserService({ id: user.id, data: updateUserDto });
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update user by admin',
    description: 'Update any user by ID (admin only). All fields are optional.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'User ID' })
  @ApiBody({ schema: UPDATE_USER_BODY_SCHEMA })
  @SwaggerResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Update user successfully ...' })
  async updateUserByAdminController(
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateUserDto>(updateUserSchema))
    updateUserDto: UpdateUserDto,
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

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload avatar', description: 'Upload avatar image for current user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Avatar image file' },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Upload avatar successfully ...' })
  async uploadAvatarController(
    @CurrentUser() user: Record<string, string>,
    @UploadedFile() file: MulterFile,
  ) {
    return await this.userService.uploadAvatarService(user.id, file);
  }

  @Get('grades')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @ApiOperation({ summary: 'Get all grades', description: 'Get all grades (tutor/admin)' })
  @SwaggerResponse({ status: 200, description: 'Grades fetched successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Grades fetched successfully' })
  async getGrades(@CurrentUser() user: Record<string, string>) {
    return this.userService.getGradesService(user.id);
  }

  @Put('grades/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @ApiOperation({
    summary: 'Update grade',
    description: 'Update a grade name and level (tutor/admin)',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Grade ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'level'],
      properties: {
        name: { type: 'string', example: 'Lớp 10' },
        level: { type: 'integer', example: 10 },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Grade updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Grade updated successfully' })
  async updateGrade(
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateGradeDto>(updateGradeSchema))
    dto: UpdateGradeDto,
  ) {
    return this.userService.updateGradeService(id, dto);
  }

  @Put('/grade')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @ApiOperation({
    summary: 'Assign grades to current user',
    description: 'Set grades array for the authenticated user (tutor/admin)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['gradesId'],
      properties: {
        gradesId: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          example: ['uuid-of-grade-1', 'uuid-of-grade-2'],
        },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'User grades updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'User grades updated successfully' })
  async updateUserGrades(
    @CurrentUser() user: Record<string, string>,
    @Body(new ZodValidationPipe<UpdateUserGradesDto>(updateUserGradesSchema))
    dto: UpdateUserGradesDto,
  ) {
    return this.userService.updateUserGradesService(user.id, dto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password', description: 'Change password for current user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string' },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Change password successfully ...' })
  async changePasswordController(
    @CurrentUser() user: Record<string, string>,
    @Body(new ZodValidationPipe(changePasswordSchema))
    changePasswordDto: ChangePasswordValues,
  ) {
    return await this.userService.changePasswordService(user.id, changePasswordDto);
  }
}
