import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private usersRepository: UsersRepository) {}

  async findAll(organizationId: string, pagination: PaginationQueryDto) {
    return this.usersRepository.findAllByOrganization(
      organizationId,
      pagination,
    );
  }

  async findOne(id: string, organizationId: string) {
    const user = await this.usersRepository.findByIdAndOrganization(
      id,
      organizationId,
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, organizationId: string) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      organizationId,
    });

    this.logger.log(`User ${dto.email} created in org ${organizationId}`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, organizationId: string) {
    await this.findOne(id, organizationId);

    const user = await this.usersRepository.update(id, organizationId, dto);

    this.logger.log(`User ${id} updated in org ${organizationId}`);
    return user;
  }
}
