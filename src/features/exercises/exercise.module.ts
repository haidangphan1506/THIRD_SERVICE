import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { ExerciseRepository } from './exercise.repository';
import { UserModule } from '../user/user.module';
import { LessonModule } from '../lesson/lesson.module';
import { SessionRepository } from '../session/session.repository';

@Module({
  imports: [UserModule, LessonModule],
  controllers: [ExerciseController],
  providers: [ExerciseService, ExerciseRepository, SessionRepository],
  exports: [ExerciseService],
})
export class ExerciseModule {}
