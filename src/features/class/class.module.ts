import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { ClassRepository } from './class.repository';
import { ClassService } from './class.service';

@Module({
  controllers: [ClassController],
  providers: [ClassService, ClassRepository],
  exports: [ClassService],
})
export class ClassModule {}
