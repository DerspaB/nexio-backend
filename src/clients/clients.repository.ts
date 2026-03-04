import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { ClientQueryDto } from './dto';

const CLIENT_SELECT = {
  id: true,
  userId: true,
  coachId: true,
  organizationId: true,
  status: true,
  currentStreak: true,
  adherenceRate: true,
  tags: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class ClientsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: ClientQueryDto,
    coachIdFilter?: string,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, status, search, coachId } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (coachIdFilter) {
      where.coachId = coachIdFilter;
    } else if (coachId) {
      where.coachId = coachId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        select: CLIENT_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
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
    return this.prisma.client.findFirst({
      where: { id, organizationId },
      select: CLIENT_SELECT,
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.client.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  async create(data: {
    userId: string;
    coachId: string;
    organizationId: string;
  }) {
    return this.prisma.client.create({
      data,
      select: CLIENT_SELECT,
    });
  }

  async createWithUser(
    userData: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      organizationId: string;
    },
    coachId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...userData,
          role: 'CLIENT',
        },
      });

      const client = await tx.client.create({
        data: {
          userId: user.id,
          coachId,
          organizationId: userData.organizationId,
        },
        select: CLIENT_SELECT,
      });

      return client;
    });
  }

  async update(id: string, organizationId: string, data: Record<string, any>) {
    return this.prisma.client.update({
      where: { id },
      data,
      select: CLIENT_SELECT,
    });
  }

  async delete(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!client) return null;

    return this.prisma.$transaction(async (tx) => {
      await tx.client.delete({ where: { id } });
      await tx.user.delete({ where: { id: client.userId } });
      return true;
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }
}
