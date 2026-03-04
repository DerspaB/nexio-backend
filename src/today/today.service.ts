import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuthUser {
  id: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class TodayService {
  constructor(private prisma: PrismaService) {}

  async getTodayForClient(clientId: string, user: AuthUser) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
      select: {
        id: true,
        coachId: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!client) throw new NotFoundException('Client not found');

    if (user.role === 'COACH' && client.coachId !== user.id) {
      throw new ForbiddenException('Cannot access this client');
    }

    const activePlan = await this.prisma.plan.findFirst({
      where: { clientId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        workoutDays: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            dayOfWeek: true,
            name: true,
            order: true,
            workoutBlocks: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
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
      },
    });

    if (!activePlan) {
      return {
        client: {
          id: client.id,
          name: `${client.user.firstName} ${client.user.lastName}`,
        },
        plan: null,
        todayWorkout: null,
        checkIn: null,
      };
    }

    const jsDay = new Date().getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    const todayWorkout =
      activePlan.workoutDays.find((d) => d.dayOfWeek === dayOfWeek) || null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = await this.prisma.checkIn.findUnique({
      where: {
        clientId_date: { clientId, date: today },
      },
    });

    return {
      client: {
        id: client.id,
        name: `${client.user.firstName} ${client.user.lastName}`,
      },
      plan: { id: activePlan.id, name: activePlan.name },
      todayWorkout,
      checkIn,
    };
  }

  async getTodayForCurrentUser(user: AuthUser) {
    const client = await this.prisma.client.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!client) throw new NotFoundException('Client profile not found');

    return this.getTodayForClient(client.id, {
      ...user,
      role: 'OWNER',
    });
  }
}
