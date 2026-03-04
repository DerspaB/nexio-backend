import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { ExerciseQueryDto } from './dto';

const EXERCISE_SELECT = {
  id: true,
  name: true,
  description: true,
  muscleGroup: true,
  equipment: true,
  videoUrl: true,
  thumbnailUrl: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ExercisesRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: ExerciseQueryDto,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, muscleGroup, equipment, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ organizationId }, { organizationId: null }],
    };

    if (muscleGroup) {
      where.muscleGroup = muscleGroup;
    }

    if (equipment) {
      where.equipment = equipment;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        select: EXERCISE_SELECT,
        skip,
        take: limit,
        orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.exercise.findFirst({
      where: {
        id,
        OR: [{ organizationId }, { organizationId: null }],
      },
      select: EXERCISE_SELECT,
    });
  }

  async findDistinctMuscleGroups(organizationId: string): Promise<string[]> {
    const results = await this.prisma.exercise.findMany({
      where: {
        OR: [{ organizationId }, { organizationId: null }],
      },
      select: { muscleGroup: true },
      distinct: ['muscleGroup'],
      orderBy: { muscleGroup: 'asc' },
    });
    return results.map((r) => r.muscleGroup);
  }

  async create(data: {
    name: string;
    description?: string;
    muscleGroup: string;
    equipment?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    organizationId: string;
  }) {
    return this.prisma.exercise.create({
      data,
      select: EXERCISE_SELECT,
    });
  }

  async update(id: string, data: Record<string, any>) {
    return this.prisma.exercise.update({
      where: { id },
      data,
      select: EXERCISE_SELECT,
    });
  }

  async delete(id: string) {
    return this.prisma.exercise.delete({ where: { id } });
  }
}
