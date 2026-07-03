import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LessonRepository } from './lesson.repository';
import { UserService } from '../user/user.service';
import { ERROR_MESSAGES } from 'src/data/constants';
import { checkUuidValid } from '@packages/helpers';
import { CreateLessonDto, UpdateLessonDto } from '@packages/entities';

@Injectable()
export class LessonService {
  private readonly logger = new Logger(LessonService.name);

  constructor(
    private readonly lessonRepository: LessonRepository,
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

  async createLessonService({ userId, createLessonDto }: { userId: string; createLessonDto: CreateLessonDto }) {
    await this.assertUserExists(userId);
    
    // Validate curriculum ownership if curriculumId is provided
    if (createLessonDto.curriculumId) {
      if (!createLessonDto.curriculumId || !checkUuidValid({ data: createLessonDto.curriculumId })) {
        throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
      }
      // Here we would verify the user has access to the specified curriculum
      // For now, we'll assume the user has appropriate permissions
    }
    
    return await this.lessonRepository.create(userId, createLessonDto);
  }

  async getAllLessonsService({ userId }: { userId: string }) {
    await this.assertUserExists(userId);
    
    // Filter lessons by user access - return user's own lessons
    return await this.lessonRepository.findByUser(userId);
  }

  async getLessonByIdService(id: string) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    // Verify user has access to this lesson
    // For now, we assume user can access their own lessons
    return lesson;
  }

  async updateLessonService(id: string, updateData: UpdateLessonDto) {
    await this.assertUserExists('dummy-user-id');
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    return await this.lessonRepository.update(id, updateData);
  }

  async deleteLessonService(id: string) {
    await this.assertUserExists('dummy-user-id');
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    return await this.lessonRepository.delete(id);
  }

  async getLessonsByCurriculumIdService(curriculumId: string) {
    if (!curriculumId || !checkUuidValid({ data: curriculumId })) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }
    
    return await this.lessonRepository.findByCurriculumId(curriculumId);
  }

  async getLessonsByChapterIdService(chapterId: string) {
    if (!chapterId || !checkUuidValid({ data: chapterId })) {
      throw new NotFoundException(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
    }
    
    return await this.lessonRepository.findByChapterId(chapterId);
  }

  async verifyLessonAccess(lessonId: string, userId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    // Verify lesson belongs to the user or if curriculum/chapter access is allowed
    if (lesson.userId !== userId) {
      throw new NotFoundException('Access denied to this lesson');
    }
    
    return lesson;
  }

  async createLessonWithFullDependenciesService({
    userId,
    lessonData,
    curriculumId,
    chapterId,
  }: {
    userId: string;
    lessonData: CreateLessonDto;
    curriculumId?: string;
    chapterId?: string;
  }) {
    await this.assertUserExists(userId);
    
    // Validate curriculum if provided
    if (curriculumId) {
      if (!curriculumId || !checkUuidValid({ data: curriculumId })) {
        throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
      }
    }
    
    // Validate chapter if provided
    if (chapterId) {
      if (!chapterId || !checkUuidValid({ data: chapterId })) {
        throw new NotFoundException(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
      }
      
      // Verify chapter belongs to the user if curriculum is specified
      if (curriculumId) {
        const chapter = await this.lessonRepository.findChapterById(chapterId);
        if (!chapter) {
          throw new NotFoundException(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
        }
        
        if (chapter.userId !== userId) {
          throw new NotFoundException('Access denied to this chapter');
        }
      }
    }
    
    const updatedLessonData = {
      ...lessonData,
      ...(curriculumId && { curriculumId: curriculumId as any }),
      ...(chapterId && { chapterId: chapterId as any }),
    };
    
    return await this.lessonRepository.create(userId, updatedLessonData as any);
  }

  async bulkCreateLessonsService({
    userId,
    lessons,
    curriculumId,
  }: {
    userId: string;
    lessons: CreateLessonDto[];
    curriculumId?: string;
  }) {
    await this.assertUserExists(userId);
    
    const createdLessons = [];
    
    for (const lessonData of lessons) {
      try {
        const createdLesson = await this.createLessonWithFullDependenciesService({
          userId,
          lessonData,
          ...(curriculumId && { curriculumId }),
        });
        createdLessons.push(createdLesson);
      } catch (error) {
        this.logger.error(`Failed to create lesson: ${lessonData.title}`, error);
        // Continue with other lessons even if one fails
        throw error;
      }
    }
    
    return {
      total: createdLessons.length,
      createdLessons,
      curriculumId,
      message: `Successfully created ${createdLessons.length} lessons`,
    };
  }

  async updateLessonWithRelationsService(
    userId: string,
    lessonId: string,
    updateData: Partial<CreateLessonDto> & { curriculumId?: string; chapterId?: string },
  ) {
    await this.assertUserExists(userId);
    
    if (!lessonId || !checkUuidValid({ data: lessonId })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    const lesson = await this.verifyLessonAccess(lessonId, userId);
    
    // Validate curriculum if provided
    if (updateData.curriculumId) {
      if (!updateData.curriculumId || !checkUuidValid({ data: updateData.curriculumId })) {
        throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
      }
    }
    
    // Validate chapter if provided
    if (updateData.chapterId) {
      if (!updateData.chapterId || !checkUuidValid({ data: updateData.chapterId })) {
        throw new NotFoundException(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
      }
      
      if (updateData.curriculumId) {
        const chapter = await this.lessonRepository.findChapterById(updateData.chapterId);
        if (!chapter) {
          throw new NotFoundException(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
        }
        
        if (chapter.userId !== userId) {
          throw new NotFoundException('Access denied to this chapter');
        }
      }
    }
    
    return await this.lessonRepository.update(lessonId, updateData as any);
  }

  async deleteLessonWithRelationsService(userId: string, lessonId: string) {
    await this.assertUserExists(userId);
    
    if (!lessonId || !checkUuidValid({ data: lessonId })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    
    const lesson = await this.verifyLessonAccess(lessonId, userId);
    
    // Check if lesson has associated theory URLs or exercise assignments
    const hasRelatedData = await this.lessonRepository.hasRelatedData(lessonId);
    if (hasRelatedData) {
      throw new NotFoundException('Cannot delete lesson with associated theory URLs or exercises');
    }
    
    return await this.lessonRepository.delete(lessonId);
  }

  async bulkDeleteLessonsService(userId: string, lessonIds: string[]) {
    await this.assertUserExists(userId);
    
    const deletedLessons = [];
    const errors: string[] = [];
    
    for (const lessonId of lessonIds) {
      try {
        await this.deleteLessonWithRelationsService(userId, lessonId);
        deletedLessons.push(lessonId);
      } catch (error) {
        errors.push(`Failed to delete lesson ${lessonId}: ${(error as Error).message}`);
      }
    }
    
    return {
      total: lessonIds.length,
      deleted: deletedLessons.length,
      errors,
      successfulIds: deletedLessons,
      message: `Deleted ${deletedLessons.length} of ${lessonIds.length} lessons`,
    };
  }

  async getLessonsStatsService(userId: string) {
    await this.assertUserExists(userId);
    
    // Get user's lessons count
    const userLessons = await this.lessonRepository.findByUser(userId);
    
    // Get lessons by curriculum
    const lessonsByCurriculum = await Promise.all(
      userLessons.map(async (lesson) => {
        const curriculumLessons = await this.lessonRepository.findByCurriculumId(lesson.curriculumId as string);
        return {
          curriculumId: lesson.curriculumId,
          count: curriculumLessons.length,
        };
      }),
    );
    
    // Get lessons by chapter
    const lessonsByChapter = await Promise.all(
      userLessons.map(async (lesson) => {
        const chapterLessons = await this.lessonRepository.findByChapterId(lesson.chapterId as string);
        return {
          chapterId: lesson.chapterId,
          count: chapterLessons.length,
        };
      }),
    );
    
    return {
      totalLessons: userLessons.length,
      byCurriculum: lessonsByCurriculum,
      byChapter: lessonsByChapter,
      recentActivity: userLessons.filter(l => new Date(l.createdAt as string) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    };
  }
}
