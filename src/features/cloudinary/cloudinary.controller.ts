import {
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse, Public } from '@packages/decorators';
import { StatusCodes } from 'http-status-codes';

import { CloudinaryService } from './cloudinary.service';
import type { MulterFile } from './cloudinary.interface';

@ApiTags('Cloudinary')
@ApiBearerAuth('access-token')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Public()
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Upload image', description: 'Upload an image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Image file to upload' },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Image uploaded successfully' })
  async uploadImageController(@UploadedFile() file: MulterFile): Promise<unknown> {
    return await this.cloudinaryService.upload(file);
  }

  @Delete('image/:publicId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Delete image',
    description: 'Delete an image from Cloudinary by public ID',
  })
  @SwaggerResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Image deleted successfully' })
  async deleteImageController(@Param('publicId') publicId: string): Promise<unknown> {
    return await this.cloudinaryService.delete(publicId);
  }
}
