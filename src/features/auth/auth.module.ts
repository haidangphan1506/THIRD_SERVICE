import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { getJwtModuleOptionsFromConfig } from '@packages/configs/jwt-sign.config';
import { RedisModule } from 'src/features/redis/redis.module';
import { FacebookStrategy, GoogleStrategy } from '@packages/strategy';

@Module({
  imports: [
    UserModule,
    EmailModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getJwtModuleOptionsFromConfig(configService),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, FacebookStrategy],
  exports: [AuthService],
})
export class AuthModule {}
