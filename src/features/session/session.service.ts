import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ClassRepository } from '../class/class.repository';
import { SessionRepository } from './session.repository';
import type { CreateSessionDto, GetSessionsQueryDto, UpdateSessionDto } from '@packages/entities/session';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class SessionService {
  constructor(
    private readonly repo: SessionRepository,
    private readonly classRepo: ClassRepository,
  ) {}

  private assertUuid(value: string, field: string) {
    if (!value || !checkUuidValid({ data: value })) {
      throw new BadRequestException(`${field} must be uuid ...`);
    }
  }

  private async assertClassOwner(classId: string, tutorId: string) {
    const cls = await this.classRepo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    return cls;
  }

  async create(dto: CreateSessionDto, tutorId: string) {
    this.assertUuid(tutorId, 'tutorId');
    this.assertUuid(dto.classId, 'classId');
    await this.assertClassOwner(dto.classId, tutorId);
    return this.repo.create(dto);
  }

  async findAll(tutorId: string, query: GetSessionsQueryDto) {
    this.assertUuid(tutorId, 'tutorId');
    if (query.classId) {
      this.assertUuid(query.classId, 'classId');
      await this.assertClassOwner(query.classId, tutorId);
    }
    return this.repo.findAll({ query });
  }

  async findById(id: string, tutorId: string) {
    this.assertUuid(id, 'id');
    this.assertUuid(tutorId, 'tutorId');
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    await this.assertClassOwner(session.classId, tutorId);
    return session;
  }

  async update(id: string, dto: UpdateSessionDto, tutorId: string) {
    this.assertUuid(id, 'id');
    this.assertUuid(tutorId, 'tutorId');
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    await this.assertClassOwner(session.classId, tutorId);
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundException('Session not found');
    return updated;
  }

  async delete(id: string, tutorId: string) {
    this.assertUuid(id, 'id');
    this.assertUuid(tutorId, 'tutorId');
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    await this.assertClassOwner(session.classId, tutorId);
    await this.repo.delete(id);
    return { id };
  }
}
