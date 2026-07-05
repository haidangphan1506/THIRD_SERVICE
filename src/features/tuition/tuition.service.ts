import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classes } from '../../database/schema';
import type {
  CreateTuitionDto,
  GetTuitionsQueryDto,
  UpdateTuitionDto,
} from '@packages/entities/tuition';
import { TuitionRepository } from './tuition.repository';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class TuitionService {
  private readonly logger = new Logger(TuitionService.name);
  constructor(
    private readonly repo: TuitionRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(dto: CreateTuitionDto, tutorId: string) {
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
    if (!dto.classId || !checkUuidValid({ data: dto.classId })) throw new BadRequestException('classId must be uuid ...');
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, dto.classId));
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    return this.repo.create(dto);
  }

  async findAll(query: GetTuitionsQueryDto) {
    return this.repo.findAll(query);
  }

  async findById(id: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    const tuition = await this.repo.findById(id);
    if (!tuition) throw new NotFoundException('Tuition record not found');
    return {
      ...tuition,
      amount: tuition.amount != null ? String(tuition.amount) : '0',
    };
  }

  async update(id: string, dto: UpdateTuitionDto, tutorId: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
    const tuition = await this.repo.findById(id);
    if (!tuition) throw new NotFoundException('Tuition record not found');
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, tuition.classId));
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    return this.repo.update(id, dto);
  }

  async delete(id: string, tutorId: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId })) throw new BadRequestException('tutorId must be uuid ...');
    const tuition = await this.repo.findById(id);
    if (!tuition) throw new NotFoundException('Tuition record not found');
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, tuition.classId));
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    await this.repo.delete(id);
    return { id };
  }

  async getSummary(classId?: string) {
    if (classId && !checkUuidValid({ data: classId })) throw new BadRequestException('classId must be uuid ...');
    return this.repo.getSummary(classId);
  }
}
