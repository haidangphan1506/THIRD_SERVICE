import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class TuitionService {
  private readonly logger = new Logger(TuitionService.name);
  constructor(
    private readonly repo: TuitionRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(dto: CreateTuitionDto, tutorId: string) {
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
    const tuition = await this.repo.findById(id);
    if (!tuition) throw new NotFoundException('Tuition record not found');
    return {
      ...tuition,
      amount: tuition.amount != null ? String(tuition.amount) : '0',
    };
  }

  async update(id: string, dto: UpdateTuitionDto, tutorId: string) {
    const tuition = await this.repo.findById(id);
    if (!tuition) throw new NotFoundException('Tuition record not found');
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, tuition.classId));
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    return this.repo.update(id, dto);
  }

  async delete(id: string, tutorId: string) {
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
    return this.repo.getSummary(classId);
  }
}
