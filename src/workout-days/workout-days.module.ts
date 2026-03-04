import { Module } from '@nestjs/common';
import { WorkoutDaysController } from './workout-days.controller';
import { WorkoutDaysService } from './workout-days.service';
import { WorkoutDaysRepository } from './workout-days.repository';

@Module({
  controllers: [WorkoutDaysController],
  providers: [WorkoutDaysService, WorkoutDaysRepository],
  exports: [WorkoutDaysService],
})
export class WorkoutDaysModule {}
