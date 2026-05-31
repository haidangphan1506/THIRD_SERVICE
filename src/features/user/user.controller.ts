import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
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
  async getDetailUserController(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<GetDetailUserQuery>(getUserDetailQuerySchema))
    detailQuery: GetDetailUserQuery,
  ) {
    this.logger.log('Data user :', user);
    return await this.userService.getDetailUserService({ id: user.id, query: detailQuery });
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

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Update user successfully ...' })
  async updateUserByAdminController(@Param('id') id: string, @Body() updateUserDto: Record<string, string>) {
    return await this.userService.updateUserService({ id: id, data: updateUserDto });
  }

  @Put('/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Update user status successfully ...' })
  async updateStatusUserController(@Param('id') id: string) {
    return await this.userService.updateStatusUserService({ id: id });
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Delete user successfully ...' })
  async deleteUserByAdminController(@Param('id') id: string) {
    return await this.userService.deleteUserByAdminService({ id: id });
  }
}
