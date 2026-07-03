import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';
import { CurriculumRepository } from './curriculum.repository';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { UploadModule } from '../uploads/upload.module';

@Module({
  imports: [UserModule, MulterModule.register({}), UploadModule],
  controllers: [CurriculumController],
  providers: [CurriculumService, CurriculumRepository, UserService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
