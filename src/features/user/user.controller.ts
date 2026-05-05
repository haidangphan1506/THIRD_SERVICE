import { Body, Controller, Get, Logger, Post, Put, Query } from '@nestjs/common';
import { StatusCodes } from 'http-status-codes';
import {
  getUsersQuerySchema,
  type GetUsersQueryDto,
  type UserDataFieldDto,
  dataFieldSchema,
  type CreateUserDto,
  createUserSchema,
  type CreateUserResponseDto,
} from '@packages/entities/user';
import { ApiResponse, CurrentUser } from '@packages/decorators';
import { ZodValidationPipe } from '@packages/pipes';
import { UserService } from './user.service';
type GetUsersResponse = Awaited<ReturnType<UserService['getUsersService']>>;

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(
    @Query(new ZodValidationPipe<GetUsersQueryDto>(getUsersQuerySchema))
    query: GetUsersQueryDto,
  ): Promise<GetUsersResponse> {
    return await this.userService.getUsersService(query);
  }

  @Get('/detail-user')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Get detail user successfully ...' })
  async getDetailUserController(@CurrentUser() user: Record<string, string>) {
    this.logger.log('Data user :', user);
    return await this.userService.getDetailUserService({ id: user.id });
  }

  @Get('/get-by-field')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'User fetched successfully' })
  async getUserByField(
    @Query(new ZodValidationPipe(dataFieldSchema))
    dataFieldDto: UserDataFieldDto,
  ): Promise<unknown> {
    return await this.userService.getUserByField(dataFieldDto);
  }

  @Post()
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'User created successfully' })
  async createUser(
    @Body(new ZodValidationPipe(createUserSchema))
    createUserDto: CreateUserDto,
  ): Promise<CreateUserResponseDto> {
    return (await this.userService.createUserService(createUserDto)) as CreateUserResponseDto;
  }

  @Put('')
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Update user successfully ...' })
  async updateUserController(
    @CurrentUser() user: Record<string, string>,
    @Body() updateUserDto: Record<string, string>,
  ) {
    return await this.userService.updateUserService({ id: user.id, data: updateUserDto });
  }
}
