import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';
import { UserService } from '../user/user.service';
import { drizzle } from 'drizzle-orm/singlestore';
import { DRIZZLE } from 'src/database/database.module';
import { type GetCurriculumsQueryDto, type CreateCurriculumDto } from '@packages/entities';
import { checkUuidValid, generateCode } from '@packages/helpers';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);
  constructor(
    private readonly curriculumRepository: CurriculumRepository,
    private readonly userService: UserService,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async generateNewCodeService(): Promise<string | null> {
    const MAX_RETRIES = 5;
    let attempts = 0;
    let newCode = generateCode();

    while (await this.curriculumRepository.findByCode(newCode)) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        throw new ConflictException('Unable to generate unique code, please try again');
      }
      newCode = generateCode();
    }

    return newCode;
  }

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

  async getCurriculumByIdService({ userId, id }: { userId: string; id: string }) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException('userId not uuid ...');
    }
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid curriculum id ...');
    }

    const user = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!user || (Array.isArray(user) && user.length === 0)) {
      throw new BadRequestException('User not found ...');
    }

    return await this.curriculumRepository.findByIdWithDetails(id);
  }

  async updateCurriculumService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: CreateCurriculumDto;
  }) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException('userId not uuid ...');
    }
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid curriculum id ...');
    }

    const user = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!user || (Array.isArray(user) && user.length === 0)) {
      throw new BadRequestException('User not found ...');
    }

    const existing = await this.curriculumRepository.findById(id);
    if (!existing) throw new NotFoundException('Curriculum not found');

    return await this.curriculumRepository.update(id, data);
  }

  async deleteCurriculumService({ userId, id }: { userId: string; id: string }) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException('userId not uuid ...');
    }
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid curriculum id ...');
    }

    const user = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!user || (Array.isArray(user) && user.length === 0)) {
      throw new BadRequestException('User not found ...');
    }

    const existing = await this.curriculumRepository.findById(id);
    if (!existing) throw new NotFoundException('Curriculum not found');

    return await this.curriculumRepository.delete(id);
  }
}
