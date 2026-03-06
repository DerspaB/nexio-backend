import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import {
  CreateExerciseDto,
  ExerciseQueryDto,
  UpdateExerciseDto,
} from './dto';
import { ExercisesRepository } from './exercises.repository';

@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  constructor(private exercisesRepository: ExercisesRepository) {}

  async findAll(query: ExerciseQueryDto, organizationId: string) {
    return this.exercisesRepository.findAll(organizationId, query);
  }

  async findMuscleGroups(organizationId: string) {
    return this.exercisesRepository.findDistinctMuscleGroups(organizationId);
  }

  async findOne(id: string, organizationId: string) {
    const exercise = await this.exercisesRepository.findById(
      id,
      organizationId,
    );
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async create(dto: CreateExerciseDto, organizationId: string) {
    const exercise = await this.exercisesRepository.create({
      ...dto,
      organizationId,
    });

    this.logger.log(`Exercise "${dto.name}" created in org ${organizationId}`);
    return exercise;
  }

  async update(id: string, dto: UpdateExerciseDto, user: AuthUser) {
    const exercise = await this.findOne(id, user.organizationId);

    if (!exercise.organizationId) {
      throw new ForbiddenException('Cannot modify global exercises');
    }

    const updated = await this.exercisesRepository.update(id, dto);

    this.logger.log(`Exercise ${id} updated in org ${user.organizationId}`);
    return updated;
  }

  async delete(id: string, user: AuthUser) {
    const exercise = await this.findOne(id, user.organizationId);

    if (!exercise.organizationId) {
      throw new ForbiddenException('Cannot delete global exercises');
    }

    await this.exercisesRepository.delete(id);

    this.logger.log(`Exercise ${id} deleted from org ${user.organizationId}`);
    return { message: 'Exercise deleted successfully' };
  }
}
