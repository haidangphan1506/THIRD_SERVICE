import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';

/**
 * Message-pattern mirror of `EmailController` — reached by the gateway's/`user`'s Kafka
 * `KafkaProducer` (RMQ `third_queue` too, if a caller still uses that transport). Delegates to
 * the same, unmodified `EmailService` the HTTP controller uses; no business logic lives here.
 */
@Controller()
export class EmailRpcController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('email.test')
  testSendEmail() {
    return this.emailService.testSendEmailService();
  }

  @MessagePattern('email.sendForgotPasswordMail')
  sendForgotPasswordMail(
    @Payload() payload: { to: string; resetToken: string; displayName: string },
  ) {
    return this.emailService.sendForgotPasswordMail(payload);
  }
}