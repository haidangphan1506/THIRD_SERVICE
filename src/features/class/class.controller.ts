import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { ZodValidationPipe } from '@packages/pipes';
import { CurrentUser } from '@packages/decorators';
import {
  createClassSchema,
  type GetClassesQueryDto,
  getClassesQuerySchema,
  type CreateClassDto,
} from '@packages/entities/class';
import { ClassService } from './class.service';
import { CLASS_SWAGGER_MESSAGES } from 'src/data/swaggers/messages';
import { CLASS_SWAGGERS_DATA } from 'src/data/swaggers/data/class.swagger';

@ApiTags('Classes')
@ApiBearerAuth('access-token')
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  // todo : create new class controller ...
  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Create class',
    description: 'Create a new class (Stage 1: class info)',
  })
  @ApiBody({ schema: CLASS_SWAGGERS_DATA.CREATE_CLASS_SCHEMA })
  @SwaggerResponse({ status: 201, description: 'Class created' })
  create(
    @Body(new ZodValidationPipe<CreateClassDto>(createClassSchema))
    dto: CreateClassDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.classService.createClassService({ data: dto, userId: user.id });
  }

  //todo : get and filter classes controller ...
  @Get('')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: CLASS_SWAGGER_MESSAGES.GET_CLASSES_SUCCESSFULLY,
    description: CLASS_SWAGGER_MESSAGES.GET_CLASSES_SUCCESSFULLY,
  })
  @ApiQuery(CLASS_SWAGGERS_DATA.GET_CLASSES_SCHEMA[0])
  @ApiQuery(CLASS_SWAGGERS_DATA.GET_CLASSES_SCHEMA[1])
  @ApiQuery(CLASS_SWAGGERS_DATA.GET_CLASSES_SCHEMA[2])
  @SwaggerResponse({
    status: StatusCodes.OK,
    description: CLASS_SWAGGER_MESSAGES.GET_CLASSES_SUCCESSFULLY,
  })
  async getClassesController(
    @Query(new ZodValidationPipe<GetClassesQueryDto>(getClassesQuerySchema))
    query: GetClassesQueryDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.classService.getClassesService({ userId: user?.id, query });
  }

  // todo : get detail class controller ...
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: CLASS_SWAGGER_MESSAGES.GET_CLASS_SUCCESSFULLY,
    description: CLASS_SWAGGER_MESSAGES.GET_CLASS_SUCCESSFULLY,
  })
  @ApiQuery(CLASS_SWAGGERS_DATA.GET_DETAIL_CLASS)
  @SwaggerResponse({
    status: StatusCodes.OK,
    description: CLASS_SWAGGER_MESSAGES.GET_CLASS_SUCCESSFULLY,
  })
  @Get('/:id')
  getDetailClassController(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return this.classService.getClassService({ userId: user?.id, id });
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: CLASS_SWAGGER_MESSAGES.DEL_CLASS_SUCCESSFULLY,
    description: CLASS_SWAGGER_MESSAGES.DEL_CLASS_SUCCESSFULLY,
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({
    status: StatusCodes.OK,
    description: CLASS_SWAGGER_MESSAGES.DEL_CLASS_SUCCESSFULLY,
  })
  delClassController(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return this.classService.delClassService({ userId: user?.id, id });
  }
}
