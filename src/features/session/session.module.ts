import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SessionRepository } from './session.repository';
import { ClassRepository } from '../class/class.repository';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository, ClassRepository],
  exports: [SessionService],
})
export class SessionModule {}
