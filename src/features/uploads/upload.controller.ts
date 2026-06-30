import {
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '@packages/decorators';
import { StatusCodes } from 'http-status-codes';
import { UploadService } from './upload.service';
import type { MulterFile, UploadResponse } from './upload.interface';

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Upload file', description: 'Upload a file to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'File uploaded' })
  async upload(@UploadedFile() file: MulterFile): Promise<UploadResponse> {
    return this.uploadService.upload(file);
  }

  @Public()
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Files uploaded' })
  async uploadMultiple(@UploadedFiles() files: MulterFile[]): Promise<UploadResponse[]> {
    return this.uploadService.uploadMultiple(files);
  }

  @Public()
  @Delete(':key')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete file' })
  @SwaggerResponse({ status: 200, description: 'File deleted' })
  async delete(@Param('key') key: string): Promise<void> {
    return this.uploadService.delete(key);
  }
}
