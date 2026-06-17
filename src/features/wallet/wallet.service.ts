import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { WalletRepository } from './wallet.repository';
import { UserService } from '../user/user.service';
import { GetWalleDtotQueryDto } from '@packages/entities';

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
@Injectable()
export class WalletService {
  private logger = new Logger(WalletService.name);

  constructor(
    private readonly wallet: WalletRepository,
    private readonly userService: UserService,
  ) {}
  async getWallets({ user, query }: { user: Record<string, string>; query: GetWalleDtotQueryDto }) {
    const { id } = user;

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new UnauthorizedException('User not found ...');
    }

    const userData = await this.userService.getUserByField({
      field: 'id',
      value: '62cdb8d3-4464-49a7-b636-09ecb57210bf',
    });

    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      throw new NotFoundException('User not found ...');
    }
    return await this.wallet.getWallets(query);
  }
}
