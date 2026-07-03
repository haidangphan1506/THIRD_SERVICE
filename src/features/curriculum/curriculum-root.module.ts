import { Module } from '@nestjs/common';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { ChapterModule } from './chapter/chapter.module';
import { LessonModule } from './lesson/lesson.module';
import { TheoryModule } from './theory/theory.module';
import { ExerciseModule } from './exercise/exercise.module';

@Module({
  imports: [
    CurriculumModule,
    ChapterModule,
    LessonModule,
    TheoryModule,
    ExerciseModule,
  ],
})
export class RootCurriculumModule {}
