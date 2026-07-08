import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './features/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from './features/email/mailer/mailer.module';
import { RedisModule } from './features/redis/redis.module';
import { EmailModule } from './features/email/email.module';
import { TransactionModule } from './features/transaction/transaction.module';
import { UserModule } from './features/user/user.module';
import { WalletModule } from './features/wallet/wallet.module';
import { CategoryModule } from './features/category/category.module';
import { ReportModule } from './features/report/report.module';
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
import { CloudinaryModule } from './features/cloudinary/cloudinary.module';
import { UploadModule } from './features/uploads/upload.module';
import { ExerciseModule } from './features/exercises/exercise.module';
import { AiModule } from './features/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MailerModule,
    RedisModule,
    UserModule,
    CategoryModule,
    AuthModule,
    WalletModule,
    TransactionModule,
    EmailModule,
    ReportModule,
    ClassModule,
    StudentModule,
    CurriculumModule,
    ChapterModule,
    LessonModule,
    TuitionModule,
    NotificationModule,
    ScheduleModule,
    SessionModule,
    CloudinaryModule,
    UploadModule,
    ExerciseModule,
    AiModule,
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
