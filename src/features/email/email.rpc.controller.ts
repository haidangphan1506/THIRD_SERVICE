import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RpcExceptionFilter } from '@packages/filters';
import { EmailService } from './email.service';

/**
 * Message-pattern mirror of `EmailController` — reached only by the gateway's `THIRD_SERVICE`
 * `ClientProxy` over RabbitMQ (RMQ transport, `third_queue`). Delegates to the same, unmodified
 * `EmailService` the HTTP controller uses; no business logic lives here.
 */
@UseFilters(RpcExceptionFilter)
@Controller()
export class EmailRpcController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('email.test')
  testSendEmail() {
    return this.emailService.testSendEmailService();
  }
}