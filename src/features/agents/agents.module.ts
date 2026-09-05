import { Module } from '@nestjs/common';
import { AgentController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  controllers: [AgentController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
