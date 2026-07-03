import { Module } from '@nestjs/common';
import { TheoryController } from './theory.controller';
import { TheoryService } from './theory.service';
import { TheoryRepository } from './theory.repository';

@Module({
  controllers: [TheoryController],
  providers: [TheoryService, TheoryRepository],
  exports: [TheoryService],
})
export class TheoryModule {}
