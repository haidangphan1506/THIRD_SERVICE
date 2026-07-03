import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponse, CurrentUser } from '@packages/decorators';
import { StatusCodes } from 'http-status-codes';

import { CreateChapterDto, UpdateChapterDto } from '@packages/entities';
import { ChapterService } from './chapter.service';

@ApiTags('Chapter')
@ApiBearerAuth('access-token')
@Controller('chapters')
export class ChapterController {
  private readonly logger = new Logger(ChapterController.name);
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create chapter', description: 'Create a new chapter' })
  @ApiBody({ schema: { required: ['title'], properties: { title: { type: 'string', example: 'Introduction' }, description: { type: 'string', example: '' }, order: { type: 'number', example: 1 } } } })
  @SwaggerResponse({ status: StatusCodes.CREATED, description: 'Chapter created successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Chapter created successfully' })
  async createChapterController(
    @Body() createChapterDto: CreateChapterDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return await this.chapterService.createChapterService({ userId: user.id, createChapterDto });
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get all chapters', description: 'Retrieve all chapters' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'All chapters retrieved successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'All chapters retrieved successfully' })
  async getAllChaptersController(@CurrentUser() user: Record<string, string>) {
    return await this.chapterService.getAllChaptersService({ userId: user.id });
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get chapter by id', description: 'Get a specific chapter by its ID' })
  @ApiParam({ name: 'id', description: 'Chapter ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Chapter retrieved successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Chapter retrieved successfully' })
  async getChapterByIdController(@Param('id') id: string) {
    return await this.chapterService.getChapterByIdService(id);
  }

  @Patch(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update chapter', description: 'Update chapter information' })
  @ApiParam({ name: 'id', description: 'Chapter ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Chapter updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Chapter updated successfully' })
  async updateChapterController(@Param('id') id: string, @Body() updateData: UpdateChapterDto) {
    return await this.chapterService.updateChapterService(id, updateData);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete chapter', description: 'Delete chapter by ID' })
  @ApiParam({ name: 'id', description: 'Chapter ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Chapter deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Chapter deleted successfully' })
  async deleteChapterController(@Param('id') id: string) {
    return await this.chapterService.deleteChapterService(id);
  }
}
