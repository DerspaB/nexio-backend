import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInQueryDto, CreateCheckInDto } from './dto';
import { CheckInsRepository } from './check-ins.repository';

interface AuthUser {
  id: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class CheckInsService {
  private readonly logger = new Logger(CheckInsService.name);

  constructor(
    private checkInsRepository: CheckInsRepository,
    private prisma: PrismaService,
  ) {}

  private async validateClientAccess(clientId: string, user: AuthUser) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
      select: { id: true, coachId: true },
    });

    if (!client) throw new NotFoundException('Client not found');

    if (user.role === 'COACH' && client.coachId !== user.id) {
      throw new ForbiddenException('Cannot access this client');
    }

    return client;
  }

  async createForClient(
    clientId: string,
    dto: CreateCheckInDto,
    user: AuthUser,
  ) {
    await this.validateClientAccess(clientId, user);

    const checkIn = await this.checkInsRepository.upsert(clientId, dto.date, {
      status: dto.status,
      workoutDayId: dto.workoutDayId,
      completedBlocks: dto.completedBlocks,
      totalBlocks: dto.totalBlocks,
      notes: dto.notes,
      durationMinutes: dto.durationMinutes,
    });

    const streak = await this.checkInsRepository.calculateStreak(clientId);
    const adherence =
      await this.checkInsRepository.calculateAdherence(clientId);

    await this.checkInsRepository.updateClientStats(
      clientId,
      streak,
      adherence,
    );
    await this.checkInsRepository.checkAndAwardAchievements(clientId, streak);

    this.logger.log(
      `Check-in created for client ${clientId} — streak: ${streak}, adherence: ${adherence}%`,
    );

    return { ...checkIn, currentStreak: streak, adherenceRate: adherence };
  }

  async createForCurrentUser(dto: CreateCheckInDto, user: AuthUser) {
    const client = await this.prisma.client.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!client) throw new NotFoundException('Client profile not found');

    return this.createForClient(client.id, dto, {
      ...user,
      role: 'OWNER',
    });
  }

  async getHistory(clientId: string, query: CheckInQueryDto, user: AuthUser) {
    await this.validateClientAccess(clientId, user);
    return this.checkInsRepository.findByClient(clientId, query);
  }
}
