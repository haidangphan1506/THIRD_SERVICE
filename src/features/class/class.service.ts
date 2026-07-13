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
import { AddStudentsDto, CreateClassDto, GetClassesQueryDto } from '@packages/entities/class';
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

    const acting = Array.isArray(user) ? user[0] : user;
    return await this.repo.getClasses({
      userId,
      role: acting?.role ?? undefined,
      query: { ...query },
    });
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

  // add one student (studentIds of length 1) or bulk students into a single class
  async addStudentsService({
    userId,
    classId,
    data,
  }: {
    userId: string;
    classId: string;
    data: AddStudentsDto;
  }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');
    if (!classId || !checkUuidValid({ data: classId }))
      throw new BadRequestException('Class Id must be uuid ...');

    // the class must exist and be owned by the acting tutor
    const classData = await this.repo.getClassByField({ field: 'id', value: classId });
    if (!classData || classData.tutorId !== userId)
      throw new NotFoundException('Class not found ...');

    // dedupe input, then verify every id references an existing STUDENT user
    const studentIds = [...new Set(data.studentIds)];
    for (const studentId of studentIds) {
      const found = await this.user.getUserByField({ field: 'id', value: studentId });
      const student = Array.isArray(found) ? found[0] : found;
      if (!student) throw new BadRequestException(`Student not found: ${studentId}`);
      if (student.role !== 'STUDENT')
        throw new BadRequestException(`User is not a student: ${studentId}`);
    }

    const inserted = await this.repo.addStudents({ classId, studentIds });
    const addedIds = inserted.map((row) => row.studentId);

    // notify each newly-enrolled student they were added to the class
    for (const studentId of addedIds) {
      void this.notificationService.createInternal({
        type: 'STUDENT',
        senderId: userId,
        userId: studentId,
        studentId,
        classId,
        title: 'Bạn được thêm vào lớp mới',
        content: `Bạn đã được thêm vào lớp ${classData.name}.`,
        actionType: 'VIEW',
        actionLabel: 'Xem lớp học',
      });
    }

    return {
      classId,
      added: addedIds.length,
      skipped: studentIds.length - addedIds.length, // already enrolled
      studentIds: addedIds,
    };
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

  // list a class's learning materials (theory + exercise files) resolved through its curriculum.
  // Returns lessons each carrying theoryUrls/exerciseUrls so the FE can render either list.
  async getClassMaterialsService({ userId, id }: { userId: string; id: string }) {
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

    const classSummary = {
      id: classData.id,
      name: classData.name,
      subject: classData.subject,
      curriculumId: classData.curriculumId,
    };

    if (!classData.curriculumId) {
      return { class: classSummary, lessons: [], theoryCount: 0, exerciseCount: 0 };
    }

    const lessons = await this.repo.getMaterials({ curriculumId: classData.curriculumId });
    const theoryCount = lessons.reduce((n, l) => n + (l.theoryUrls?.length ?? 0), 0);
    const exerciseCount = lessons.reduce((n, l) => n + (l.exerciseUrls?.length ?? 0), 0);

    return { class: classSummary, lessons, theoryCount, exerciseCount };
  }

  async getAllStudentsService({ userId, id }: { userId: string; id: string }) {
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
    if (!classData || classData.id !== id) throw new NotFoundException('Class not found ...');

    const result = await this.repo.getAllStudent({ id });
    return result;
  }
}
