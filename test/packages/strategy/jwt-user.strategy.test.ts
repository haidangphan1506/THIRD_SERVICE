import { ConfigService } from '@nestjs/config';
import { JwtUserStrategy } from '@packages/strategy';

describe('JwtUserStrategy', () => {
  let mockConfigService: {
    get: jest.Mock;
  };

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    };
  });

  describe('constructor', () => {
    it('should get jwt secret from config', () => {
      mockConfigService.get.mockReturnValue('secret');

      const strategy = new JwtUserStrategy(mockConfigService as unknown as ConfigService);

      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
      expect(strategy).toBe('secret');
    });

    it('should use fallback secret when config is undefined', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const strategy = new JwtUserStrategy(mockConfigService as unknown as ConfigService);

      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return payload', () => {
      const strategy = new JwtUserStrategy(mockConfigService as unknown as ConfigService);

      const payload = {
        sub: '1',
        email: 'test@gmail.com',
        typ: 'access' as const,
        role: 'STUDENT' as const,
      };

      expect(strategy.validate(payload)).toEqual(payload);
    });
  });
});
