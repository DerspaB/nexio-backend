import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const WORKOUT_DAY_SELECT = {
  id: true,
  planId: true,
  dayOfWeek: true,
  name: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  workoutBlocks: {
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      exerciseId: true,
      order: true,
      sets: true,
      reps: true,
      restSeconds: true,
      notes: true,
      exercise: {
        select: {
          id: true,
          name: true,
          muscleGroup: true,
          equipment: true,
          thumbnailUrl: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class WorkoutDaysRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.workoutDay.findUnique({
      where: { id },
      select: WORKOUT_DAY_SELECT,
    });
  }

  async findByIdWithPlan(id: string) {
    return this.prisma.workoutDay.findUnique({
      where: { id },
      include: {
        plan: { select: { organizationId: true, createdById: true } },
      },
    });
  }

  async create(data: {
    planId: string;
    dayOfWeek: number;
    name: string;
    order: number;
  }) {
    return this.prisma.workoutDay.create({
      data,
      select: WORKOUT_DAY_SELECT,
    });
  }

  async update(id: string, data: Record<string, any>) {
    return this.prisma.workoutDay.update({
      where: { id },
      data,
      select: WORKOUT_DAY_SELECT,
    });
  }

  async delete(id: string) {
    return this.prisma.workoutDay.delete({ where: { id } });
  }
}
