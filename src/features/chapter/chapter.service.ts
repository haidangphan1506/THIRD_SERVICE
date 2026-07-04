import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ChapterRepository } from './chapter.repository';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
  type CreateChapterDto,
  type UpdateChapterDto,
  type GetChaptersQueryDto,
} from '@packages/entities';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class ChapterService {
  constructor(
    private readonly chapterRepository: ChapterRepository,
    @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async createChapterService({
    curriculumId,
    data,
  }: {
    curriculumId: string;
    data: CreateChapterDto;
  }) {
    if (!curriculumId || !checkUuidValid({ data: curriculumId })) {
      throw new BadRequestException('curriculumId must be a valid UUID');
    }
    return await this.chapterRepository.create({ curriculumId, data });
  }

  async getAllChaptersService({ query }: { query: GetChaptersQueryDto }) {
    const { curriculumId, page, limit } = query;
    if (!curriculumId || !checkUuidValid({ data: curriculumId })) {
      throw new BadRequestException('curriculumId must be a valid UUID');
    }
    return await this.chapterRepository.findAll({ curriculumId, page, limit });
  }

  async getChapterByIdService({ id }: { id: string }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid chapter id');
    }
    return await this.chapterRepository.findById(id);
  }

  async updateChapterService({ id, data }: { id: string; data: UpdateChapterDto }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid chapter id');
    }
    const existing = await this.chapterRepository.findById(id);
    if (!existing) throw new NotFoundException('Chapter not found');
    return await this.chapterRepository.update(id, data);
  }

  async deleteChapterService({ id }: { id: string }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid chapter id');
    }
    const existing = await this.chapterRepository.findById(id);
    if (!existing) throw new NotFoundException('Chapter not found');
    return await this.chapterRepository.delete(id);
  }
}
