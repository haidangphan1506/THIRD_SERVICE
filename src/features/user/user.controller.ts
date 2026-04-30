import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import {
  getUsersQuerySchema,
  type GetUsersQueryDto,
  type UserDataFieldDto,
  dataFieldSchema,
  type CreateUserDto,
  createUserSchema,
  type CreateUserResponseDto,
} from '../../entities/user';
import { ApiResponse } from '../../decorators';
import { ZodValidationPipe } from '../../pipes';
import { UserService } from './user.service';
import { StatusCodes } from 'http-status-codes';
type GetUsersResponse = ReturnType<UserService['getUsersService']>;

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @Get()
  getUsers(
    @Query(new ZodValidationPipe<GetUsersQueryDto>(getUsersQuerySchema))
    query: GetUsersQueryDto,
  ): GetUsersResponse {
    return this.userService.getUsersService(query);
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
}
