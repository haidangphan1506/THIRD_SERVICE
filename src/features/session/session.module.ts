import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';
import { ClassModule } from '../class/class.module';
import { LessonModule } from '../lesson/lesson.module';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ClassModule, LessonModule, UserModule, NotificationModule],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository],
  exports: [SessionService],
})
export class SessionModule {}
