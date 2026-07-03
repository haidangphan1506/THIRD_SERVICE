import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ExerciseRepository } from './exercise.repository';
import { UserService } from '../user/user.service';
import { ERROR_MESSAGES } from 'src/data/constants';
import { checkUuidValid } from '@packages/helpers';
import { CreateAssignmentDto, UpdateAssignmentDto } from '@packages/entities';

@Injectable()
export class ExerciseService {
  private readonly logger = new Logger(ExerciseService.name);

  constructor(
    private readonly exerciseRepository: ExerciseRepository,
    private readonly userService: UserService,
  ) {}

  private async assertUserExists(userId: string) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
    }
    const userData = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }

  async createExerciseService({ userId, createExerciseDto }: { userId: string; createExerciseDto: CreateAssignmentDto }) {
    await this.assertUserExists(userId);
    return await this.exerciseRepository.create(userId, createExerciseDto);
  }

  async getAllExercisesService({ userId }: { userId: string }) {
    await this.assertUserExists(userId);
    return await this.exerciseRepository.findAll({ userId });
  }

  async getExerciseByIdService(id: string) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND);
    }
    return await this.exerciseRepository.findById(id);
  }

  async updateExerciseService(id: string, updateData: UpdateAssignmentDto) {
    await this.assertUserExists('dummy-user-id');
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND);
    }
    return await this.exerciseRepository.update(id, updateData);
  }

  async deleteExerciseService(id: string) {
    await this.assertUserExists('dummy-user-id');
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND);
    }
    return await this.exerciseRepository.delete(id);
  }

  async createExerciseWithLessonDependency(createData: CreateAssignmentDto) {
    await this.assertUserExists('dummy-user-id');
    if (!createData.lesson || !checkUuidValid({ data: createData.lesson })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    return await this.exerciseRepository.createWithLessonDependency(createData);
  }
}
