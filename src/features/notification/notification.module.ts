import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationRpcController } from './notification.rpc.controller';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';

@Module({
  imports: [],
  controllers: [NotificationController, NotificationRpcController],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
