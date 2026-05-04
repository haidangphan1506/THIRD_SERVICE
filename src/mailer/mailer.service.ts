import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export type SendMailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

/** Phần API nodemailer đang dùng (tránh phụ thuộc resolve type `Transporter` từ package). */
type MailTransport = {
  sendMail(options: {
    from?: string;
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    replyTo?: string;
  }): Promise<unknown>;
  verify(): Promise<unknown>;
  close(): void;
};

export function useGmailTransport(config: ConfigService): boolean {
  const service = config.get<string>('MAIL_SERVICE')?.trim().toLowerCase();
  if (service === 'gmail') {
    return true;
  }
  if (config.get<string>('MAIL_USE_GMAIL')?.trim() === 'true') {
    return true;
  }
  const host = config.get<string>('MAIL_HOST')?.trim().toLowerCase();
  return host === 'smtp.gmail.com';
}

@Injectable()
export class MailerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailerService.name);
  private transporter: MailTransport | null = null;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('MAIL_USER')?.trim();
    const passRaw = this.configService.get<string>('MAIL_PASS')?.trim();
    /** Google App Password thường hiển thị có dấu cách — SMTP cần chuỗi 16 ký tự không cách */
    const pass = passRaw ? passRaw.replace(/\s/g, '') : '';

    if (useGmailTransport(this.configService)) {
      if (!user || !pass) {
        this.logger.warn(
          'Gmail SMTP: cần MAIL_USER (địa chỉ Gmail) và MAIL_PASS (Google App Password, không phải mật khẩu đăng nhập thường).',
        );
        return;
      }
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      }) as MailTransport;
      this.logger.log('Mailer: transport Gmail (nodemailer service: gmail)');
      return;
    }

    const host = this.configService.get<string>('MAIL_HOST')?.trim();
    const portRaw = this.configService.get<string>('MAIL_PORT')?.trim();
    if (!host || !portRaw) {
      this.logger.warn('MAIL_HOST / MAIL_PORT not set — MailerService.sendMail will fail until configured');
      return;
    }
    const port = Number(portRaw);
    const secure = this.configService.get<string>('MAIL_SECURE')?.trim() === 'true';

    this.transporter = nodemailer.createTransport({
      host,
      port: Number.isFinite(port) ? port : 587,
      secure,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    }) as MailTransport;
  }

  async onModuleInit(): Promise<void> {
    if (!this.transporter) {
      return;
    }
    try {
      await this.transporter.verify();
      this.logger.log('SMTP verify(): kết nối và xác thực thành công');
    } catch (err) {
      this.logger.error(
        `SMTP verify() thất bại — mail sẽ không gửi được cho đến khi sửa cấu hình: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  isReady(): boolean {
    return this.transporter !== null;
  }

  async sendMail(input: SendMailInput): Promise<void> {
    if (!this.transporter) {
      throw new ServiceUnavailableException(
        'Mail is not configured: set MAIL_SERVICE=gmail + MAIL_USER + MAIL_PASS, or MAIL_HOST + MAIL_PORT (+ auth if needed)',
      );
    }
    let from = this.configService.get<string>('MAIL_FROM')?.trim();
    if (!from && useGmailTransport(this.configService)) {
      from = this.configService.get<string>('MAIL_USER')?.trim();
      if (from) {
        this.logger.warn(`MAIL_FROM trống — dùng MAIL_USER làm người gửi: ${from}`);
      }
    }
    if (!from) {
      throw new ServiceUnavailableException('MAIL_FROM is not set (với Gmail có thể để trống nếu đã set MAIL_USER)');
    }

    const info = (await this.transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    })) as {
      messageId?: string;
      accepted?: string[];
      rejected?: string[];
      response?: string;
    };

    this.logger.log(
      `sendMail ok messageId=${info.messageId ?? 'n/a'} accepted=${JSON.stringify(info.accepted ?? [])} rejected=${JSON.stringify(info.rejected ?? [])}`,
    );
    if (info.rejected && info.rejected.length > 0) {
      this.logger.warn(`Một số địa chỉ bị từ chối bởi SMTP: ${JSON.stringify(info.rejected)}`);
    }
  }

  onModuleDestroy(): void {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
}
