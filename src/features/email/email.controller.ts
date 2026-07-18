import { Controller, Get } from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from '@packages/decorators';

@Controller('emails')
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Public()
  @Get('')
  async testSendEmailController() {
    return await this.email.testSendEmailService();
  }
}
