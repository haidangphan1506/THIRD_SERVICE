import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { LessonRepository } from './lesson.repository';
import { UserModule } from '../user/user.module';
import { UploadModule } from '../uploads/upload.module';

@Module({
  imports: [UserModule, MulterModule.register({ storage: memoryStorage() }), UploadModule],
  controllers: [LessonController],
  providers: [LessonService, LessonRepository],
  exports: [LessonService],
})
export class LessonModule {}
