import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WalletRepository } from './wallet.repository';
import { UserService } from '../user/user.service';
import { CategoryService } from '../category/category.service';
import { GetWalleDtotQueryDto, UpdateWalletDto, type CreateWalletDto } from '@packages/entities';
import { ERROR_MESSAGES } from 'src/data/constants';

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
@Injectable()
export class WalletService {
  private logger = new Logger(WalletService.name);
  private readonly searchableFields = ['id', 'name'] as const;

  constructor(
    private readonly wallet: WalletRepository,
    private readonly userService: UserService,
    private readonly categoryService: CategoryService,
  ) {}

  private async assertCategoriesExist(categoriesId?: string[]) {
    if (!categoriesId || categoriesId.length === 0) return;
    for (const categoryId of categoriesId) {
      const category = await this.categoryService.getCategoryService({
        field: 'id',
        value: categoryId,
      });
      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORIES_NOT_FOUND);
      }
    }
  }

  async getWalletByFieldService({
    userId,
    field,
    value,
  }: {
    userId: string;
    field: string;
    value: string;
  }) {
    if (!this.searchableFields.includes(field as (typeof this.searchableFields)[number])) {
      throw new BadRequestException(`Unsupported field: ${field}`);
    }
    return await this.wallet.findByField(
      userId,
      field as (typeof this.searchableFields)[number],
      value,
    );
  }

  async getWalletsService({
    user,
    query,
  }: {
    user: Record<string, string>;
    query?: GetWalleDtotQueryDto;
  }) {
    const { id } = user;

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
    }

    const userData = await this.userService.getUserByField({
      field: 'id',
      value: id,
    });

    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return await this.wallet.getWallets(query ?? {});
  }

  async createWallet({
    user,
    createWalletDto,
  }: {
    user: Record<string, string>;
    createWalletDto: CreateWalletDto;
  }) {
    const { id } = user;

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
    }

    const userData = await this.userService.getUserByField({
      field: 'id',
      value: id,
    });
    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const walletExist = await this.getWalletByFieldService({
      userId: id,
      field: 'name',
      value: createWalletDto.name,
    });
    if (walletExist.length > 0) {
      throw new ConflictException(ERROR_MESSAGES.WALLET_NAME_EXISTS);
    }

    await this.assertCategoriesExist(createWalletDto.categoriesId);

    return await this.wallet.create(id, createWalletDto);
  }

  async updateWalletService({
    user,
    id,
    updateWalletDto,
  }: {
    user: Record<string, string>;
    id: string;
    updateWalletDto: UpdateWalletDto;
  }) {
    const { id: userId } = user;

    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
    }

    const userData = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.WALLET_NOT_EXISTS);
    }

    const walletExist = await this.getWalletByFieldService({
      userId: userId,
      field: 'name',
      value: updateWalletDto.name ?? '',
    });

    if (!walletExist || (Array.isArray(walletExist) && !walletExist.length)) {
      throw new NotFoundException(ERROR_MESSAGES.WALLET_NOT_EXISTS);
    }

    await this.assertCategoriesExist(updateWalletDto.categoriesId);

    return await this.wallet.updateWalet({ id, updateWalletDto });
  }

  async deleteWalletService({ user, id }: { user: Record<string, string>; id: string }) {
    const { id: userId } = user;

    if (!userId || !UUID_V4_REGEX.test(userId)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
    }

    const userData = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.WALLET_NOT_EXISTS);
    }

    const walletExist = await this.getWalletByFieldService({
      userId,
      field: 'id',
      value: id,
    });
    if (!walletExist || (Array.isArray(walletExist) && !walletExist.length)) {
      throw new NotFoundException(ERROR_MESSAGES.WALLET_NOT_EXISTS);
    }

    return await this.wallet.deleteWallet({ id });
  }
}
