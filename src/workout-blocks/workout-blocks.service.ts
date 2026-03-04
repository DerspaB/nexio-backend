import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateWorkoutBlockDto,
  ReorderBlocksDto,
  UpdateWorkoutBlockDto,
} from './dto';
import { WorkoutBlocksRepository } from './workout-blocks.repository';

interface AuthUser {
  id: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class WorkoutBlocksService {
  private readonly logger = new Logger(WorkoutBlocksService.name);

  constructor(private workoutBlocksRepository: WorkoutBlocksRepository) {}

  private async validateAccess(blockId: string, user: AuthUser) {
    const block = await this.workoutBlocksRepository.findByIdWithPlan(blockId);
    if (!block) throw new NotFoundException('Workout block not found');

    if (block.workoutDay.plan.organizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot access this workout block');
    }

    if (
      user.role === 'COACH' &&
      block.workoutDay.plan.createdById !== user.id
    ) {
      throw new ForbiddenException('Cannot modify this workout block');
    }

    return block;
  }

  async create(dto: CreateWorkoutBlockDto, user: AuthUser) {
    const block = await this.workoutBlocksRepository.create(dto);
    this.logger.log(`Workout block created for day ${dto.workoutDayId}`);
    return block;
  }

  async update(id: string, dto: UpdateWorkoutBlockDto, user: AuthUser) {
    await this.validateAccess(id, user);
    const updated = await this.workoutBlocksRepository.update(id, dto);
    this.logger.log(`Workout block ${id} updated`);
    return updated;
  }

  async delete(id: string, user: AuthUser) {
    await this.validateAccess(id, user);
    await this.workoutBlocksRepository.delete(id);
    this.logger.log(`Workout block ${id} deleted`);
    return { message: 'Workout block deleted successfully' };
  }

  async reorder(items: ReorderBlocksDto, user: AuthUser) {
    if (items.length > 0) {
      await this.validateAccess(items[0].id, user);
    }

    await this.workoutBlocksRepository.reorder(items);
    this.logger.log(`Reordered ${items.length} workout blocks`);
    return { message: 'Blocks reordered successfully' };
  }
}
