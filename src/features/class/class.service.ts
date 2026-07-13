import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { ClassRepository } from './class.repository';
import { NotificationService } from '../notification/notification.service';
import { CreateClassDto, GetClassesQueryDto } from '@packages/entities/class';
import { checkUuidValid, generateCode } from '@packages/helpers';
import { UserService } from '../user/user.service';

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);
  constructor(
    private readonly repo: ClassRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
    private readonly notificationService: NotificationService,
    private readonly user: UserService,
  ) {}

  async generateNewCodeService(): Promise<string> {
    const MAX_RETRIES = 5;
    let attempts = 0;
    let newCode = generateCode();

    while (await this.repo.getClassByField({ field: 'code', value: newCode })) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        throw new ConflictException('Unable to generate unique code, please try again');
      }
      newCode = generateCode();
    }

    return newCode;
  }

  async createClassService({ userId, data }: { userId: string; data: CreateClassDto }) {
    const { name, code, tutorId } = data;
    if (!userId || (userId && !checkUuidValid({ data: userId }))) {
      throw new BadRequestException('User Id must be uuid ...');
    }
    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!user || (Array.isArray(user) && user.length === 0)) {
      throw new BadRequestException('User not found ...');
    }

    const nameExtst = await this.repo.getClassByField({ field: 'name', value: name });
    if (nameExtst) throw new BadRequestException('Name class is exist ...');

    const codeExtst = await this.repo.getClassByField({ field: 'code', value: code });
    if (codeExtst) throw new BadRequestException('Code class is exist ...');

    if (!tutorId || (tutorId && !checkUuidValid({ data: tutorId }))) {
      throw new BadRequestException('Tutor Id must be uuid ...');
    }
    const tutor = await this.user.getUserByField({
      field: 'id',
      value: tutorId,
    });
    if (!tutor || (Array.isArray(tutor) && tutor.length === 0)) {
      throw new BadRequestException('Tutor not found ...');
    }
    return await this.repo.create({ data });
  }

  async getClassesService({ userId, query }: { userId: string; query: GetClassesQueryDto }) {
    if (!userId || (userId && !checkUuidValid({ data: userId })))
      throw new BadRequestException('User Id must be uuid ...');

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!user || (Array.isArray(user) && user.length === 0))
      throw new NotFoundException('User not exist ...');

    return await this.repo.getClasses({ userId: userId, query: { ...query } });
  }

  //todo : get detail class service ...
  async getClassService({ userId, id }: { userId: string; id: string }) {
    if (!userId || (userId && !checkUuidValid({ data: userId })))
      throw new BadRequestException('User Id must be uuid ...');

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!user || (Array.isArray(user) && user.length === 0))
      throw new NotFoundException('User not exist ...');
    return this.repo.getClass({ id });
  }

  async delClassService({ userId, id }: { userId: string; id: string }) {
    if (!userId || (userId && !checkUuidValid({ data: userId })))
      throw new BadRequestException('User Id must be uuid ...');
    if (!id || !checkUuidValid({ data: id }))
      throw new BadRequestException('Class Id must be uuid ...');

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!user || (Array.isArray(user) && user.length === 0))
      throw new NotFoundException('User not exist ...');

    const classData = await this.repo.getClassByField({ field: 'id', value: id });
    if (!classData) throw new NotFoundException('Class not found ...');
    if (classData.tutorId !== userId) throw new NotFoundException('Class not found ...');

    const deleted = await this.repo.delClass({ id });
    if (!deleted) throw new NotFoundException('Class not found ...');

    return { id };
  }
}
