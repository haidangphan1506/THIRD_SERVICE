import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { hashData, compareData } from '../../../src/packages/helpers/hashingData.helper';

jest.mock('bcrypt');

const mockedBcrypt = jest.mocked(bcrypt);

describe('hashing data ...', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashData ...', () => {
    it('should return a hashed string when bcrypt succeeds', async () => {
      const input = 'my-secret-password';
      const hashedValue = '$2b$10$hashedResult';

      mockedBcrypt.hash.mockResolvedValue(hashedValue as never);

      const result = await hashData(input);

      expect(result).toBe(hashedValue);
      expect(bcrypt.hash).toHaveBeenCalledWith(input, 10);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('should use salt rounds of 10', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashed' as never);

      await hashData('any-data');

      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
    });

    it('should throw BadRequestException when bcrypt.hash fails', async () => {
      const bcryptError = new Error('bcrypt internal error');
      mockedBcrypt.hash.mockRejectedValue(bcryptError as never);

      await expect(hashData('some-data')).rejects.toThrow(BadRequestException);
      await expect(hashData('some-data')).rejects.toThrow(
        `Failed to hash data: ${bcryptError}`,
      );
    });

    it('should hash an empty string without throwing', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashed-empty' as never);

      const result = await hashData('');

      expect(result).toBe('hashed-empty');
      expect(bcrypt.hash).toHaveBeenCalledWith('', 10);
    });
  });

  describe('compareData ...', () => {
    it('should return true when data matches the hash', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await compareData('my-password', '$2b$10$someHash');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('my-password', '$2b$10$someHash');
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should return false when data does not match the hash', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await compareData('wrong-password', '$2b$10$someHash');

      expect(result).toBe(false);
    });

    it('should throw BadRequestException when bcrypt.compare fails', async () => {
      const bcryptError = new Error('bcrypt internal error');
      mockedBcrypt.compare.mockRejectedValue(bcryptError as never);

      await expect(compareData('data', 'hash')).rejects.toThrow(BadRequestException);
      await expect(compareData('data', 'hash')).rejects.toThrow(
        `Failed to verify data: ${bcryptError}`,
      );
    });
  });
});
