import { ConfigService } from '@nestjs/config';
import {
  getJwtModuleOptionsFromConfig,
  getJwtTokensConfig,
} from '@packages/configs/jwt-sign.config';
import {
  DEFAULT_JWT_ACCESS_EXPIRES_SECONDS,
  DEFAULT_JWT_REFRESH_EXPIRES_SECONDS,
} from '@packages/helpers';

describe('JwtSignConfig ...', () => {
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'get'>>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    };
  });

  describe('getJwtTokensConfig ...', () => {
    test('1. should be parse valid numeric expires seconds from env ...', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_ACCESS_EXPIRES_SECONDS: '7200',
          JWT_REFRESH_EXPIRES_SECONDS: '172800',
        };
        return values[key];
      });

      const result = getJwtTokensConfig(mockConfigService as unknown as ConfigService);

      expect(result).toEqual({
        accessSecret: 'access-secret',
        accessExpiresIn: 7200,
        refreshSecret: 'refresh-secret',
        refreshExpiresIn: 172800,
      });
    });

    test('2. should be fallback to default expires seconds when env is not a positive number ...', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_ACCESS_EXPIRES_SECONDS: 'not-a-number',
          JWT_REFRESH_EXPIRES_SECONDS: '-10',
        };
        return values[key];
      });

      const result = getJwtTokensConfig(mockConfigService as unknown as ConfigService);

      expect(result.accessExpiresIn).toBe(DEFAULT_JWT_ACCESS_EXPIRES_SECONDS);
      expect(result.refreshExpiresIn).toBe(DEFAULT_JWT_REFRESH_EXPIRES_SECONDS);
      expect(result.refreshSecret).toBe('access-secret');
    });

    test('3. should be fallback to dev-insecure-jwt-secret when no secret is provided ...', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = getJwtTokensConfig(mockConfigService as unknown as ConfigService);

      expect(result.accessSecret).toBe('dev-insecure-jwt-secret');
      expect(result.refreshSecret).toBe('dev-insecure-jwt-secret');
      expect(result.accessExpiresIn).toBe(DEFAULT_JWT_ACCESS_EXPIRES_SECONDS);
      expect(result.refreshExpiresIn).toBe(DEFAULT_JWT_REFRESH_EXPIRES_SECONDS);
    });
  });

  describe('getJwtModuleOptionsFromConfig ...', () => {
    test('1. should be build module options using access secret and access expires in ...', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_ACCESS_EXPIRES_SECONDS: '3600',
        };
        return values[key];
      });

      const result = getJwtModuleOptionsFromConfig(mockConfigService as unknown as ConfigService);

      expect(result).toEqual({
        secret: 'access-secret',
        signOptions: { expiresIn: 3600 },
      });
    });
  });
});
