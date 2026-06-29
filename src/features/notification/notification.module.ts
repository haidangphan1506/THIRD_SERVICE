import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { UserModule } from '../user/user.module';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [UserModule, ClassModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
