import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';
import { UserService } from '../user/user.service';
import { drizzle } from 'drizzle-orm/singlestore';
import { DRIZZLE } from 'src/database/database.module';
import { type GetCurriculumsQueryDto, type CreateCurriculumDto } from '@packages/entities';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);
  constructor(
    private readonly curriculumRepository: CurriculumRepository,
    private readonly userService: UserService,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async createCurriculumService({
    userId,
    createCurriculum,
  }: {
    userId: string;
    createCurriculum: CreateCurriculumDto;
  }) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException('userId must be uuid ...');
    }

    const user = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (Array.isArray(user) && user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    return await this.curriculumRepository.create({ userId, data: createCurriculum });
  }

  async getAllCurriculumService({
    userId,
    query,
  }: {
    userId: string;
    query: GetCurriculumsQueryDto;
  }) {
    this.logger.log('user id : ', userId);
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException('userId must be uuid ...');
    }

    const user = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (Array.isArray(user) && user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    this.logger.log('query :', query);
    return await this.curriculumRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      searchableColumns: {},
      filters: {},
      filterColumns: {},
    });
  }

  async getCurriculumByIdService(id: string) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid curriculum id ...');
    }

    return await this.curriculumRepository.findById(id);
  }

  async updateCurriculumService(id: string, updateData: CreateCurriculumDto) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid curriculum id ...');
    }

    return await this.curriculumRepository.update(id, updateData);
  }

  async deleteCurriculumService(id: string) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid curriculum id ...');
    }

    return await this.curriculumRepository.delete(id);
  }
}
