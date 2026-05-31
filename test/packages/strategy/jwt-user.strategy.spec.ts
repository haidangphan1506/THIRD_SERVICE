import { ConfigService } from '@nestjs/config';
import { JwtUserStrategy } from '@packages/strategy';

describe('JwtUserStrategy', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
  });

  describe('init constructor and check data from this ...', () => {
    it('should be create constructor and check data from this ...', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        return {
          JWT_ACCESS_SECRET: 'test-secret',
        }[key];
      });
      const strategy = new JwtUserStrategy(configService);

      expect(strategy).toBeDefined();
      expect((configService.get as jest.Mock).mock.calls?.[0]?.[0] as unknown as string).toBe(
        'JWT_ACCESS_SECRET',
      );
    });
  });
});

describe('init configService and data from this ...', () => {
  it('should be implemented', () => {});
});
