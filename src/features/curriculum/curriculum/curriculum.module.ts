import { Module } from '@nestjs/common';
import { CurriculumController } from './curriculum/curriculum.controller';
import { CurriculumService } from './curriculum/curriculum.service';
import { CurriculumRepository } from './curriculum/curriculum.repository';

@Module({
  controllers: [CurriculumController],
  providers: [CurriculumService, CurriculumRepository],
  exports: [CurriculumService],
})
export class CurriculumModule {}
