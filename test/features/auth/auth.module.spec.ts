import { MODULE_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import 'reflect-metadata';
import { AuthController } from 'src/features/auth/auth.controller';
import { AuthModule } from 'src/features/auth/auth.module';
import { AuthService } from 'src/features/auth/auth.service';
import { EmailModule } from 'src/features/email/email.module';
import { RedisModule } from 'src/features/redis/redis.module';
import { UserModule } from 'src/features/user/user.module';
import { getJwtModuleOptionsFromConfig } from '@packages/configs/jwt-sign.config';

jest.mock('@nestjs/jwt', () => ({
  JwtModule: {
    registerAsync: jest.fn().mockReturnValue('JWT_MODULE'),
  },
}));

jest.mock('@packages/configs/jwt-sign.config', () => ({
  getJwtModuleOptionsFromConfig: jest.fn().mockReturnValue({ secret: 'test-secret', signOptions: {} }),
}));

describe('Auth Module ...', () => {
  test('0. should be defined auth module ...', () => {
    expect(AuthModule).toBeDefined();
  });

  test('1. should be register imports ...', () => {
    const imports: unknown[] =
      (Reflect.getMetadata(MODULE_METADATA.IMPORTS, AuthModule) as unknown[] | undefined) ?? [];

    expect(imports).toEqual(expect.arrayContaining([UserModule, EmailModule, RedisModule]));
  });

  it('should register controller', () => {
    const controllers: unknown[] =
      (Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, AuthModule) as unknown[] | undefined) ?? [];

    expect(controllers).toContain(AuthController);
  });

  it('should register provider', () => {
    const providers =
      (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) as unknown[] | undefined) ?? [];

    expect(providers).toContain(AuthService);
  });

  it('should export AuthService', () => {
    const exportsMetadata =
      (Reflect.getMetadata(MODULE_METADATA.EXPORTS, AuthModule) as unknown[] | undefined) ?? [];

    expect(exportsMetadata).toContain(AuthService);
  });

  it('should configure JwtModule via registerAsync', () => {
    const imports: unknown[] =
      (Reflect.getMetadata(MODULE_METADATA.IMPORTS, AuthModule) as unknown[] | undefined) ?? [];
    expect(imports).toContain('JWT_MODULE');
  });

  it('useFactory should delegate to getJwtModuleOptionsFromConfig', () => {
    type AsyncConfig = { useFactory: (cfg: ConfigService) => unknown };

    // JwtModule is a plain mock object — cast to plain type to avoid unbound-method false-positive.
    const registerAsync = (JwtModule as unknown as { registerAsync: jest.Mock }).registerAsync;
    const [[asyncConfig]] = registerAsync.mock.calls as [[AsyncConfig]];

    const mockConfigService = {} as ConfigService;
    asyncConfig.useFactory(mockConfigService);

    expect(jest.mocked(getJwtModuleOptionsFromConfig)).toHaveBeenCalledWith(mockConfigService);
  });
});
