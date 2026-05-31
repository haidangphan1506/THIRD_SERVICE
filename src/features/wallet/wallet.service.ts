import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WalletRepository } from './wallet.repository';
import { type CreateWalletDto } from '@packages/entities/wallet/wallet.dto';
import { type InferSelectModel } from 'drizzle-orm';
import { wallets } from 'src/database/schema';
import { UserService } from '../user/user.service';

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type WalletListResponse = {
  data: InferSelectModel<typeof wallets>[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
type WalletUpdateInput = Partial<Omit<CreateWalletDto, 'userId'>>;

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  constructor(
    private readonly wallet: WalletRepository,
    private readonly userService: UserService,
  ) {}

  async createWalletService(
    createWalletDto: CreateWalletDto & { userId: string },
  ): Promise<InferSelectModel<typeof wallets>> {
    const { userId, ...rest } = createWalletDto;

    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID');
    }

    const user = await this.userService.getUserByField({ field: 'id', value: userId });

    if (!user || !Array.isArray(user) || user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const existingWallet = await this.wallet.getWalletsByUserId({
      userId,
      filters: createWalletDto.name ? { name: createWalletDto.name } : undefined,
      filterColumns: { name: { column: wallets.name } },
    });
    if (existingWallet.wallets.length > 0) {
      throw new BadRequestException('Wallet already exists ...');
    }

    return await this.wallet.createWallet({ userId, ...rest });
  }

  async getWalletsService({
    userId,
    page = 1,
    limit = 10,
  }: {
    userId: string;
    page?: number;
    limit?: number;
  }): Promise<WalletListResponse> {
    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID');
    }

    const user = await this.userService.getUserByField({ field: 'id', value: userId });

    if (!user || !Array.isArray(user) || user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const { wallets: walletRows, total } = await this.wallet.getWalletsByUserId({
      userId,
      page: pageNumber,
      limit: limitNumber,
    });

    return {
      data: walletRows,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async getWalletByIdService({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<InferSelectModel<typeof wallets>> {
    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID ...');
    }

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new BadRequestException('Wallet ID must be a valid UUID');
    }

    const user = await this.userService.getUserByField({ field: 'id', value: userId });
    if (!user || !Array.isArray(user) || user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const wallet = await this.wallet.getWalletsByUserId({
      userId,
      page: 1,
      limit: 1,
      filters: { id },
      filterColumns: { id: { column: wallets.id } },
    });

    if (!wallet || wallet.wallets.length === 0) {
      throw new BadRequestException('Wallet not found ...');
    }

    return wallet.wallets[0];
  }

  async updateWalletService({
    userId,
    id,
    updateWalletDto,
  }: {
    userId: string;
    id: string;
    updateWalletDto: WalletUpdateInput;
  }): Promise<InferSelectModel<typeof wallets>> {
    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID');
    }
    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new BadRequestException('Wallet ID must be a valid UUID');
    }

    const user = await this.userService.getUserByField({ field: 'id', value: userId });
    if (!user || !Array.isArray(user) || user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const wallet = await this.getWalletByIdService({ userId, id });
    if (!wallet) {
      throw new BadRequestException('Wallet not found ...');
    }

    const updatedWallet = await this.wallet.updateWalletById({
      userId,
      id,
      updateWalletDto,
    });

    if (!updatedWallet) {
      throw new BadRequestException('Wallet not found ...');
    }

    return updatedWallet;
  }

  async deleteWalletService({ userId, id }: { userId: string; id: string }): Promise<boolean> {
    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID');
    }
    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new BadRequestException('Wallet ID must be a valid UUID');
    }

    const user = await this.userService.getUserByField({ field: 'id', value: userId });
    if (!user || !Array.isArray(user) || user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const wallet = await this.getWalletByIdService({ userId, id });
    if (!wallet) {
      throw new BadRequestException('Wallet not found ...');
    }

    return this.wallet.deleteWalletById({ userId, id });
  }
}
