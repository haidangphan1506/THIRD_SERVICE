import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './features/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from './features/email/mailer/mailer.module';
import { RedisModule } from './features/redis/redis.module';
import { UserModule } from './features/user/user.module';
import { AdminModule } from './features/admin/admin.module';
import { ClassModule } from './features/class/class.module';
import { StudentModule } from './features/student/student.module';
import { CurriculumModule } from './features/curriculum/curriculum.module';
import { ChapterModule } from './features/chapter/chapter.module';
import { LessonModule } from './features/lesson/lesson.module';
import { TuitionModule } from './features/tuition/tuition.module';
import { NotificationModule } from './features/notification/notification.module';
import { ScheduleModule } from './features/schedule/schedule.module';
import { SessionModule } from './features/session/session.module';
import { JwtAuthGuard } from '@packages/guards';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from './features/uploads/upload.module';
import { ExerciseModule } from './features/exercise/exercise.module';
import { AiModule } from './features/ai/ai.module';
import { DashboardModule } from './features/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MailerModule,
    RedisModule,
    UserModule,
    AdminModule,
    AuthModule,
    ClassModule,
    StudentModule,
    CurriculumModule,
    ChapterModule,
    LessonModule,
    TuitionModule,
    NotificationModule,
    ScheduleModule,
    SessionModule,
    UploadModule,
    ExerciseModule,
    AiModule,
    DashboardModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
