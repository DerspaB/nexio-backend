import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ClientQueryDto, CreateClientDto, UpdateClientDto } from './dto';
import { ClientsRepository } from './clients.repository';

interface AuthUser {
  id: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private clientsRepository: ClientsRepository) {}

  async findAll(query: ClientQueryDto, user: AuthUser) {
    const coachIdFilter = user.role === 'COACH' ? user.id : undefined;
    return this.clientsRepository.findAll(
      user.organizationId,
      query,
      coachIdFilter,
    );
  }

  async findOne(id: string, user: AuthUser) {
    const client = await this.clientsRepository.findById(
      id,
      user.organizationId,
    );
    if (!client) throw new NotFoundException('Client not found');

    if (user.role === 'COACH' && client.coachId !== user.id) {
      throw new ForbiddenException('You can only access your own clients');
    }

    return client;
  }

  async create(dto: CreateClientDto, user: AuthUser) {
    const existing = await this.clientsRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const coachId = dto.coachId || user.id;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const client = await this.clientsRepository.createWithUser(
      {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        organizationId: user.organizationId,
      },
      coachId,
    );

    this.logger.log(
      `Client ${dto.email} created in org ${user.organizationId}`,
    );
    return client;
  }

  async update(id: string, dto: UpdateClientDto, user: AuthUser) {
    await this.findOne(id, user);

    const client = await this.clientsRepository.update(
      id,
      user.organizationId,
      dto,
    );

    this.logger.log(`Client ${id} updated in org ${user.organizationId}`);
    return client;
  }

  async delete(id: string, user: AuthUser) {
    await this.findOne(id, user);

    await this.clientsRepository.delete(id);

    this.logger.log(`Client ${id} deleted from org ${user.organizationId}`);
    return { message: 'Client deleted successfully' };
  }
}
