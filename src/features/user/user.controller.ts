import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import {
  createUserSchema,
  type CreateUserDto,
  getUsersQuerySchema,
  type GetUsersQueryDto,
} from '../../entities/user';
import { ZodValidationPipe } from '../../pipes';
import { UserService } from './user.service';
type GetUsersResponse = ReturnType<UserService['getUsersService']>;
type CreateUserResponse = ReturnType<UserService['createUserService']>;

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

  @Post()
  createUser(
    @Body(new ZodValidationPipe<CreateUserDto>(createUserSchema))
    body: CreateUserDto,
  ): CreateUserResponse {
    this.logger.log('Create user controller ...');
    return this.userService.createUserService(body);
  }
}
