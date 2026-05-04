import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export async function hashData(data: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt
    .hash(data, saltRounds)
    .then((hash) => hash)
    .catch((error: Error) => {
      throw new BadRequestException(`Failed to hash data: ${error}`);
    });
}

export async function compareData(data: string, hash: string): Promise<boolean> {
  return await bcrypt
    .compare(data, hash)
    .then((result: boolean) => result)
    .catch((error: Error) => {
      throw new BadRequestException(`Failed to verify data: ${error}`);
    });
}
