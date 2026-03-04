import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CheckInQueryDto } from './dto';

const CHECKIN_SELECT = {
  id: true,
  clientId: true,
  date: true,
  status: true,
  workoutDayId: true,
  completedBlocks: true,
  totalBlocks: true,
  notes: true,
  durationMinutes: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CheckInsRepository {
  constructor(private prisma: PrismaService) {}

  async upsert(
    clientId: string,
    date: Date,
    data: {
      status: string;
      workoutDayId?: string;
      completedBlocks: number;
      totalBlocks: number;
      notes?: string;
      durationMinutes?: number;
    },
  ) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    return this.prisma.checkIn.upsert({
      where: { clientId_date: { clientId, date: dateOnly } },
      update: { ...data, status: data.status as any },
      create: {
        clientId,
        date: dateOnly,
        ...data,
        status: data.status as any,
      },
      select: CHECKIN_SELECT,
    });
  }

  async findByClient(
    clientId: string,
    query: CheckInQueryDto,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { clientId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.checkIn.findMany({
        where,
        select: {
          ...CHECKIN_SELECT,
          workoutDay: {
            select: { id: true, name: true, dayOfWeek: true },
          },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.checkIn.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async calculateStreak(clientId: string): Promise<number> {
    const checkIns = await this.prisma.checkIn.findMany({
      where: { clientId, status: 'COMPLETED' },
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 365,
    });

    if (checkIns.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expectedDate = new Date(today);

    for (const checkIn of checkIns) {
      const checkInDate = new Date(checkIn.date);
      checkInDate.setHours(0, 0, 0, 0);

      const diffDays = Math.round(
        (expectedDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (diffDays === 1 && streak === 0) {
        streak++;
        expectedDate = new Date(checkInDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  async calculateAdherence(clientId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [completedCount, totalDays] = await Promise.all([
      this.prisma.checkIn.count({
        where: {
          clientId,
          status: 'COMPLETED',
          date: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.checkIn.count({
        where: {
          clientId,
          date: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    if (totalDays === 0) return 0;
    return Math.round((completedCount / totalDays) * 100);
  }

  async updateClientStats(
    clientId: string,
    streak: number,
    adherenceRate: number,
  ) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: { currentStreak: streak, adherenceRate },
    });
  }

  async checkAndAwardAchievements(clientId: string, streak: number) {
    const totalCheckIns = await this.prisma.checkIn.count({
      where: { clientId },
    });

    const achievementsToCheck: { type: string; condition: boolean }[] = [
      { type: 'FIRST_CHECKIN', condition: totalCheckIns >= 1 },
      { type: 'STREAK_7', condition: streak >= 7 },
      { type: 'STREAK_30', condition: streak >= 30 },
    ];

    if (streak >= 7) {
      achievementsToCheck.push({ type: 'PERFECT_WEEK', condition: true });
    }

    for (const achievement of achievementsToCheck) {
      if (achievement.condition) {
        await this.prisma.achievement.upsert({
          where: {
            clientId_type: {
              clientId,
              type: achievement.type as any,
            },
          },
          update: {},
          create: {
            clientId,
            type: achievement.type as any,
          },
        });
      }
    }
  }
}
