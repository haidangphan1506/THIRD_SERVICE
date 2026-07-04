import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { ClassRepository } from './class.repository';
import { ClassService } from './class.service';
import { SessionRepository } from '../session/session.repository';

@Module({
  controllers: [ClassController],
  providers: [ClassService, ClassRepository, SessionRepository],
  exports: [ClassService],
})
export class ClassModule {}
