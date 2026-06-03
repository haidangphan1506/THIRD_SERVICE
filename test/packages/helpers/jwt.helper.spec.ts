import {
  JwtSignContract,
  JwtTokensConfig,
  signAccessToken,
  signRefreshToken,
} from '@packages/helpers';

describe('JwtHelper ...', () => {
  let mockJwtSignContact: JwtSignContract;

  const config: JwtTokensConfig = {
    accessSecret: 'access-secret',
    accessExpiresIn: 3600,
    refreshSecret: 'refresh-secret',
    refreshExpiresIn: 86400,
  };

  beforeEach(() => {
    mockJwtSignContact = {
      signAsync: jest.fn(),
    };
  });

  describe('signAccessToken ...', () => {
    test('1. should be sign with access token ...', async () => {
      (mockJwtSignContact.signAsync as jest.Mock).mockResolvedValue('accesstoken');
      const payload = {
        sub: '1',
        email: 'test@gmail.com',
        role: 'USER' as const,
      };
      const result = await signAccessToken(mockJwtSignContact, payload, config);
      expect(result).toBe('accesstoken');
      expect(mockJwtSignContact.signAsync).toHaveBeenCalledWith(
        {
          ...payload,
          typ: 'access',
        },
        {
          secret: config.accessSecret,
          expiresIn: config.accessExpiresIn,
        },
      );
    });

    test('2. should be throw error when signAsync failed ...', async () => {
      (mockJwtSignContact.signAsync as jest.Mock).mockRejectedValue('failed');
      const payload = {
        sub: '1',
        email: 'test@gmail.com',
        role: 'USER' as const,
      };

      await expect(signAccessToken(mockJwtSignContact, payload, config)).rejects.toBe('failed');
    });

    test('3. should be call once and payload can remain ...', async () => {
      (mockJwtSignContact.signAsync as jest.Mock).mockResolvedValue('accesstoken');
      const payload = {
        sub: '1',
        email: 'test@gmail.com',
        role: 'USER' as const,
      };
      const result = await signAccessToken(mockJwtSignContact, payload, config);

      expect(result).toBe('accesstoken');
      expect(mockJwtSignContact.signAsync).toHaveBeenCalledTimes(1);
      expect(payload).toEqual({
        sub: '1',
        email: 'test@gmail.com',
        role: 'USER',
      });
    });
  });

  describe('signRefreshToken ...', () => {
    test('1. should be sign with refresh token ...', async () => {
      (mockJwtSignContact.signAsync as jest.Mock).mockResolvedValue('refreshtoken');
      const payload = {
        sub: '1',
        email: 'test@gmail.com',
      };
      const result = await signRefreshToken(mockJwtSignContact, payload, config);
      expect(result).toBe('refreshtoken');
      expect(mockJwtSignContact.signAsync).toHaveBeenCalledWith(
        {
          ...payload,
          typ: 'refresh',
        },
        {
          secret: config.refreshSecret,
          expiresIn: config.refreshExpiresIn,
        },
      );
    });

    test('2. should be throw error when signAsync failed ...', async () => {
      (mockJwtSignContact.signAsync as jest.Mock).mockRejectedValue('failed');
      const payload = {
        sub: '1',
        email: 'test@gmail.com',
      };

      await expect(signRefreshToken(mockJwtSignContact, payload, config)).rejects.toBe('failed');
    });

    test('3. should be call once and payload can remain ...', async () => {
      (mockJwtSignContact.signAsync as jest.Mock).mockResolvedValue('refreshtoken');
      const payload = {
        sub: '1',
        email: 'test@gmail.com',
      };
      const result = await signRefreshToken(mockJwtSignContact, payload, config);

      expect(result).toBe('refreshtoken');
      expect(mockJwtSignContact.signAsync).toHaveBeenCalledTimes(1);
      expect(payload).toEqual({
        sub: '1',
        email: 'test@gmail.com',
      });
    });
  });
});
