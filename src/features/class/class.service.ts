import { Injectable, Logger } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { ClassRepository } from './class.repository';
import { NotificationService } from '../notification/notification.service';
import { CreateClassDto } from '@packages/entities/class';

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);
  constructor(
    private readonly repo: ClassRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
    private readonly notificationService: NotificationService,
  ) {}

  //todo: create new class ...

  createClassService({ userId, data }: { userId: string; data: CreateClassDto }) {
    const { name, code, studentIds, tutorId, curriculumId } = data;
    console.log(name, code, studentIds, tutorId, curriculumId, userId);

    return data;
  }
}
