import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateWorkoutDayDto, UpdateWorkoutDayDto } from './dto';
import { WorkoutDaysRepository } from './workout-days.repository';

@Injectable()
export class WorkoutDaysService {
  private readonly logger = new Logger(WorkoutDaysService.name);

  constructor(private workoutDaysRepository: WorkoutDaysRepository) {}

  private async validateAccess(dayId: string, user: AuthUser) {
    const day = await this.workoutDaysRepository.findByIdWithPlan(dayId);
    if (!day) throw new NotFoundException('Workout day not found');

    if (day.plan.organizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot access this workout day');
    }

    if (user.role === 'COACH' && day.plan.createdById !== user.id) {
      throw new ForbiddenException('Cannot modify this workout day');
    }

    return day;
  }

  async create(dto: CreateWorkoutDayDto, user: AuthUser) {
    const day = await this.workoutDaysRepository.create(dto);
    this.logger.log(`Workout day created for plan ${dto.planId}`);
    return day;
  }

  async update(id: string, dto: UpdateWorkoutDayDto, user: AuthUser) {
    await this.validateAccess(id, user);
    const updated = await this.workoutDaysRepository.update(id, dto);
    this.logger.log(`Workout day ${id} updated`);
    return updated;
  }

  async delete(id: string, user: AuthUser) {
    await this.validateAccess(id, user);
    await this.workoutDaysRepository.delete(id);
    this.logger.log(`Workout day ${id} deleted`);
    return { message: 'Workout day deleted successfully' };
  }
}
