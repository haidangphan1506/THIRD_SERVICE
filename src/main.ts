import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from '@packages/interceptor/response.interceptor';
import { ErrorInterceptor, LoggerInterceptor } from '@packages/interceptor';
import { HttpExceptionFilter } from '@packages/filters';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Mail env ──────────────────────────────────
  console.log('══════ Mail Configuration ══════');
  console.log(`MAIL_SERVICE=${configService.get('MAIL_SERVICE')}`);
  console.log(`MAIL_HOST=${configService.get('MAIL_HOST')}`);
  console.log(`MAIL_PORT=${configService.get('MAIL_PORT')}`);
  console.log(`MAIL_SECURE=${configService.get('MAIL_SECURE')}`);
  console.log(`MAIL_USER=${configService.get('MAIL_USER')}`);
  console.log(
    `MAIL_PASS=${configService.get('MAIL_PASS') ? '***' + String(configService.get('MAIL_PASS')).slice(-4) : 'undefined'}`,
  );
  console.log(`MAIL_FROM=${configService.get('MAIL_FROM')}`);

  // ── Cloudflare R2 env ────────────────────────
  console.log('══════ Cloudflare R2 Configuration ══════');
  console.log(`CLOUDFLARE_R2_ENDPOINT=${configService.get('CLOUDFLARE_R2_ENDPOINT')}`);
  console.log(`CLOUDFLARE_R2_BUCKET=${configService.get('CLOUDFLARE_R2_BUCKET')}`);
  console.log(`CLOUDFLARE_R2_REGION=${configService.get('CLOUDFLARE_R2_REGION')}`);
  console.log(`CLOUDFLARE_R2_PUBLIC_URL=${configService.get('CLOUDFLARE_R2_PUBLIC_URL')}`);
  console.log(`CLOUDFLARE_R2_ACCESS_KEY_ID=${configService.get('CLOUDFLARE_R2_ACCESS_KEY_ID')}`);
  console.log(
    `CLOUDFLARE_R2_SECRET_ACCESS_KEY=${configService.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY') ? '***' + String(configService.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY')).slice(-4) : 'undefined'}`,
  );

  // ── Cloudinary env ───────────────────────────
  console.log('══════ Cloudinary Configuration ══════');
  console.log(`CLOUDINARY_CLOUD_NAME=${configService.get('CLOUDINARY_CLOUD_NAME')}`);
  console.log(`CLOUDINARY_API_KEY=${configService.get('CLOUDINARY_API_KEY')}`);
  console.log(
    `CLOUDINARY_API_SECRET=${configService.get('CLOUDINARY_API_SECRET') ? '***' + String(configService.get('CLOUDINARY_API_SECRET')).slice(-4) : 'undefined'}`,
  );
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.useGlobalInterceptors(new ErrorInterceptor(), new LoggerInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Backends API')
    .setDescription('API documentation for the Backends financial management system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
      },
      'access-token',
    )
    // ── Tutor Management ─────────────────────────────
    .addTag('Users')
    .addTag('Auth')
    .addTag('Students')
    .addTag('Curriculum')
    .addTag('Chapter')
    .addTag('Lesson')
    .addTag('Classes')
    .addTag('Schedules')
    .addTag('Sessions')
    .addTag('Exercises')
    .addTag('Tuitions')
    .addTag('Notifications')
    // ── Finance Management ────────────────────────────
    .addTag('Categories')
    .addTag('Wallets')
    .addTag('Transactions')
    .addTag('Reports')
    // ── System ────────────────────────────────────────
    .addTag('Upload')
    .addTag('Cloudinary')
    .addTag('Health')
    .addTag('Redis')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 8888);
}
void bootstrap();
