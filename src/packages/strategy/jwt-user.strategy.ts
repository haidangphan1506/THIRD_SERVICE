import { Injectable } from '@nestjs/common';
import { JwtPayload } from '..';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, 'jwt-user') {
  constructor(configService: ConfigService) {
    const secret: string = configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev-insecure-secret';
    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };

    super(opts);
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
