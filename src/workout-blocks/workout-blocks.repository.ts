import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BLOCK_SELECT = {
  id: true,
  workoutDayId: true,
  type: true,
  exerciseId: true,
  order: true,
  sets: true,
  reps: true,
  restSeconds: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  exercise: {
    select: {
      id: true,
      name: true,
      muscleGroup: true,
      equipment: true,
      thumbnailUrl: true,
    },
  },
} as const;

@Injectable()
export class WorkoutBlocksRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.workoutBlock.findUnique({
      where: { id },
      select: BLOCK_SELECT,
    });
  }

  async findByIdWithPlan(id: string) {
    return this.prisma.workoutBlock.findUnique({
      where: { id },
      include: {
        workoutDay: {
          include: {
            plan: { select: { organizationId: true, createdById: true } },
          },
        },
      },
    });
  }

  async create(data: {
    workoutDayId: string;
    type?: string;
    exerciseId?: string | null;
    order: number;
    sets?: number;
    reps?: string;
    restSeconds?: number;
    notes?: string | null;
  }) {
    return this.prisma.workoutBlock.create({
      data: data as any,
      select: BLOCK_SELECT,
    });
  }

  async update(id: string, data: Record<string, any>) {
    return this.prisma.workoutBlock.update({
      where: { id },
      data,
      select: BLOCK_SELECT,
    });
  }

  async delete(id: string) {
    return this.prisma.workoutBlock.delete({ where: { id } });
  }

  async reorder(items: { id: string; order: number }[]) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.workoutBlock.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
  }
}
