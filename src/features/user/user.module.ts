import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '@packages/guards';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard,JwtService,ConfigService],
  exports: [UserService],
})
export class UserModule {}
