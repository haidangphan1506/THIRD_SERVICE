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
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TuitionService {
  private readonly logger = new Logger(TuitionService.name);
  constructor(
    private readonly repo: TuitionRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateTuitionDto, tutorId: string) {
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    if (!dto.classId || !checkUuidValid({ data: dto.classId }))
      throw new BadRequestException('classId must be uuid ...');
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, dto.classId));
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const result = await this.repo.create(dto);
    void this.notificationService.createInternal({
      type: 'TUITION',
      senderId: tutorId,
      userId: dto.studentId,
      classId: dto.classId,
      title: 'Học phí mới',
      content: `Bạn có học phí mới cần thanh toán. Số tiền: ${Number(dto.amount).toLocaleString('vi-VN')} VND`,
      actionType: 'PAYMENT',
      actionLabel: 'Xem chi tiết',
    });
    return result;
  }

  async findAll(query: GetTuitionsQueryDto) {
    return this.repo.findAll(query);
  }

  async findById(id: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    const tuition = await this.repo.findById(id);
    if (!tuition) throw new NotFoundException('Tuition record not found');
    return tuition;
  }

  async update(id: string, dto: UpdateTuitionDto, tutorId: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
    const tuition = await this.repo.findById(id);
    if (!tuition) throw new NotFoundException('Tuition record not found');
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, tuition.classId));
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    const updated = await this.repo.update(id, dto);
    if (dto.status === 'PAID' && updated) {
      void this.notificationService.createInternal({
        type: 'TUITION',
        senderId: tutorId,
        userId: tuition.studentId,
        classId: tuition.classId,
        title: 'Xác nhận thanh toán học phí',
        content: 'Học phí của bạn đã được xác nhận thanh toán thành công.',
        actionType: 'PAYMENT',
        actionLabel: 'Xem chi tiết',
      });
    }
    return updated;
  }

  async delete(id: string, tutorId: string) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    if (!tutorId || !checkUuidValid({ data: tutorId }))
      throw new BadRequestException('tutorId must be uuid ...');
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
    if (classId && !checkUuidValid({ data: classId }))
      throw new BadRequestException('classId must be uuid ...');
    return this.repo.getSummary(classId);
  }
}
