import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseRepository } from './exercise.repository';
import { ExerciseService } from './exercise.service';
import { UserModule } from '../user/user.module';
import { SessionModule } from '../session/session.module';
import { LessonModule } from '../lesson/lesson.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [UserModule, SessionModule, LessonModule, NotificationModule],
  controllers: [ExerciseController],
  providers: [ExerciseService, ExerciseRepository],
  exports: [ExerciseService],
})
export class ExerciseModule {}
