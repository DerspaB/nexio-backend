import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { PlanQueryDto } from './dto';

const PLAN_SELECT = {
  id: true,
  name: true,
  description: true,
  isTemplate: true,
  status: true,
  durationWeeks: true,
  clientId: true,
  createdById: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const PLAN_DETAIL_SELECT = {
  ...PLAN_SELECT,
  client: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  workoutDays: {
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      dayOfWeek: true,
      name: true,
      order: true,
      workoutBlocks: {
        orderBy: { order: 'asc' as const },
        select: {
          id: true,
          type: true,
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
    },
  },
} as const;

@Injectable()
export class PlansRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: PlanQueryDto,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, isTemplate, status, clientId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (isTemplate !== undefined) {
      where.isTemplate = isTemplate;
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        select: {
          ...PLAN_SELECT,
          client: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          _count: { select: { workoutDays: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.count({ where }),
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
    return this.prisma.plan.findFirst({
      where: { id, organizationId },
      select: PLAN_DETAIL_SELECT,
    });
  }

  async create(data: {
    name: string;
    description?: string;
    isTemplate: boolean;
    status: string;
    durationWeeks: number;
    clientId?: string;
    createdById: string;
    organizationId: string;
  }) {
    return this.prisma.plan.create({
      data: data as any,
      select: PLAN_SELECT,
    });
  }

  async update(id: string, data: Record<string, any>) {
    return this.prisma.plan.update({
      where: { id },
      data,
      select: PLAN_SELECT,
    });
  }

  async delete(id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }

  async duplicate(id: string, organizationId: string, createdById: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, organizationId },
      include: {
        workoutDays: {
          include: { workoutBlocks: true },
        },
      },
    });

    if (!plan) return null;

    return this.prisma.plan.create({
      data: {
        name: `${plan.name} (copia)`,
        description: plan.description,
        isTemplate: true,
        status: 'TEMPLATE',
        durationWeeks: plan.durationWeeks,
        createdById,
        organizationId,
        workoutDays: {
          create: plan.workoutDays.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            order: day.order,
            workoutBlocks: {
              create: day.workoutBlocks.map((block) => ({
                type: block.type,
                exerciseId: block.exerciseId,
                order: block.order,
                sets: block.sets,
                reps: block.reps,
                restSeconds: block.restSeconds,
                notes: block.notes,
              })),
            },
          })),
        },
      },
      select: PLAN_DETAIL_SELECT,
    });
  }

  async assign(
    id: string,
    clientId: string,
    organizationId: string,
    createdById: string,
  ) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, organizationId },
      include: {
        workoutDays: {
          include: { workoutBlocks: true },
        },
      },
    });

    if (!plan) return null;

    return this.prisma.$transaction(async (tx) => {
      await tx.plan.updateMany({
        where: { clientId, status: 'ACTIVE' },
        data: { status: 'PAUSED' },
      });

      return tx.plan.create({
        data: {
          name: plan.name,
          description: plan.description,
          isTemplate: false,
          status: 'ACTIVE',
          durationWeeks: plan.durationWeeks,
          clientId,
          createdById,
          organizationId,
          workoutDays: {
            create: plan.workoutDays.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              name: day.name,
              order: day.order,
              workoutBlocks: {
                create: day.workoutBlocks.map((block) => ({
                  exerciseId: block.exerciseId,
                  order: block.order,
                  sets: block.sets,
                  reps: block.reps,
                  restSeconds: block.restSeconds,
                  notes: block.notes,
                })),
              },
            })),
          },
        },
        select: PLAN_DETAIL_SELECT,
      });
    });
  }
}
