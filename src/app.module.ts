import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './features/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from './features/transaction/mailer/mailer.module';
import { RedisModule } from './features/redis/redis.module';
import { EmailModule } from './features/email/email.module';
import { TransactionModule } from './features/transaction/transaction.module';
import { UserModule } from './features/user/user.module';
import { WalletModule } from './features/wallet/wallet.module';
import { CategoryModule } from './features/category/category.module';
import { JwtAuthGuard } from '@packages/guards';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MailerModule,
    RedisModule,
    UserModule,
    CategoryModule,
    AuthModule,
    WalletModule,
    TransactionModule,
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
