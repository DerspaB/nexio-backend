import { Module } from '@nestjs/common';
import { WorkoutBlocksController } from './workout-blocks.controller';
import { WorkoutBlocksService } from './workout-blocks.service';
import { WorkoutBlocksRepository } from './workout-blocks.repository';

@Module({
  controllers: [WorkoutBlocksController],
  providers: [WorkoutBlocksService, WorkoutBlocksRepository],
  exports: [WorkoutBlocksService],
})
export class WorkoutBlocksModule {}
