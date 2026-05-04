import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '../../mailer/mailer.service';
import { RedisService } from '../../redis/redis.service';

const PASSWORD_RESET_REDIS_PREFIX = 'password_reset:';

export type SendForgotPasswordMailParams = {
  to: string;
  resetToken: string;
  displayName: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Lưu token reset (userId) trong Redis — ví dụ TTL 1 giờ; bước reset-password sẽ đọc lại.
   */
  async savePasswordResetToken(token: string, userId: string, ttlSeconds = 3600): Promise<void> {
    await this.redis.set(`${PASSWORD_RESET_REDIS_PREFIX}${token}`, userId, ttlSeconds);
  }

  /**
   * Gửi email chứa link reset (frontend ghép với `PASSWORD_RESET_URL_BASE`).
   */
  async sendForgotPasswordMail(params: SendForgotPasswordMailParams): Promise<void> {
    const base =
      this.configService.get<string>('PASSWORD_RESET_URL_BASE')?.trim() || 'http://localhost:3000';
    const resetUrl = `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(params.resetToken)}`;

    const subject = 'Đặt lại mật khẩu';
    const text = [
      `Xin chào ${params.displayName},`,
      '',
      'Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu. Mở liên kết sau (có hiệu lực giới hạn):',
      resetUrl,
      '',
      'Nếu bạn không yêu cầu, bỏ qua email này.',
    ].join('\n');

    const html = `
      <p>Xin chào <strong>${escapeHtml(params.displayName)}</strong>,</p>
      <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu.</p>
      <p><a href="${encodeURI(resetUrl)}">Nhấn vào đây để đặt lại mật khẩu</a></p>
      <p>Hoặc copy liên kết: <code>${escapeHtml(resetUrl)}</code></p>
      <p>Nếu bạn không yêu cầu, bỏ qua email này.</p>
    `.trim();

    if (!this.mailer.isReady()) {
      const nodeEnv = this.configService.get<string>('NODE_ENV')?.trim() || 'development';
      if (nodeEnv === 'production') {
        throw new ServiceUnavailableException(
          'Mail is not configured (Gmail: MAIL_SERVICE=gmail + MAIL_USER + MAIL_PASS + MAIL_FROM; hoặc MAIL_HOST + MAIL_PORT)',
        );
      }
      this.logger.warn(
        `SMTP chưa cấu hình (${nodeEnv}) — không gửi email; token vẫn lưu Redis. Đặt MAIL_SERVICE=gmail + MAIL_USER + MAIL_PASS (+ MAIL_FROM) trong .env tại thư mục chạy Nest. Link reset (dev): ${resetUrl}`,
      );
      return;
    }

    try {
      await this.mailer.sendMail({
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Đã gửi email forgot-password tới ${params.to} — kiểm tra hộp thư & thư mục Spam.`);
    } catch (err) {
      this.logger.error(
        `sendForgotPasswordMail failed for ${params.to}`,
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
