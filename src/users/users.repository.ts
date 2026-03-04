import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
} as const;

type UserResult = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findAllByOrganization(
    organizationId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<UserResult>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { organizationId },
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { organizationId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByIdAndOrganization(id: string, organizationId: string) {
    return this.prisma.user.findFirst({
      where: { id, organizationId },
      select: USER_SELECT,
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: any;
    organizationId: string;
  }) {
    return this.prisma.user.create({
      data,
      select: USER_SELECT,
    });
  }

  async update(id: string, organizationId: string, data: Record<string, any>) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }
}
