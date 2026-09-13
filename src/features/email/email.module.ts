import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailRpcController } from './email.rpc.controller';
import { EmailService } from './email.service';

@Module({
  controllers: [EmailController, EmailRpcController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
