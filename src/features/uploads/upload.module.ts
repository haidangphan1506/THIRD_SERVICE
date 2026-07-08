import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3ClientProvider } from './upload.provider';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [UploadController],
  providers: [UploadService, S3ClientProvider],
  exports: [UploadService],
})
export class UploadModule {}
