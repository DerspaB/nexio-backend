import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlanDto, PlanQueryDto, UpdatePlanDto } from './dto';
import { PlansRepository } from './plans.repository';

interface AuthUser {
  id: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private plansRepository: PlansRepository) {}

  async findAll(query: PlanQueryDto, user: AuthUser) {
    const adjustedQuery = { ...query };

    if (user.role === 'COACH' && !query.isTemplate) {
      adjustedQuery.clientId = adjustedQuery.clientId || undefined;
    }

    return this.plansRepository.findAll(user.organizationId, adjustedQuery);
  }

  async findOne(id: string, user: AuthUser) {
    const plan = await this.plansRepository.findById(id, user.organizationId);
    if (!plan) throw new NotFoundException('Plan not found');

    if (user.role === 'COACH' && !plan.isTemplate && plan.createdById !== user.id) {
      throw new ForbiddenException('Cannot access this plan');
    }

    return plan;
  }

  async create(dto: CreatePlanDto, user: AuthUser) {
    const status = dto.isTemplate ? 'TEMPLATE' : 'ACTIVE';

    const plan = await this.plansRepository.create({
      ...dto,
      status,
      createdById: user.id,
      organizationId: user.organizationId,
    });

    this.logger.log(`Plan "${dto.name}" created by ${user.id}`);
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto, user: AuthUser) {
    await this.findOne(id, user);

    const updated = await this.plansRepository.update(id, dto);
    this.logger.log(`Plan ${id} updated by ${user.id}`);
    return updated;
  }

  async delete(id: string, user: AuthUser) {
    await this.findOne(id, user);
    await this.plansRepository.delete(id);
    this.logger.log(`Plan ${id} deleted by ${user.id}`);
    return { message: 'Plan deleted successfully' };
  }

  async duplicate(id: string, user: AuthUser) {
    const result = await this.plansRepository.duplicate(
      id,
      user.organizationId,
      user.id,
    );
    if (!result) throw new NotFoundException('Plan not found');

    this.logger.log(`Plan ${id} duplicated by ${user.id}`);
    return result;
  }

  async assign(id: string, clientId: string, user: AuthUser) {
    const result = await this.plansRepository.assign(
      id,
      clientId,
      user.organizationId,
      user.id,
    );
    if (!result) throw new NotFoundException('Plan not found');

    this.logger.log(`Plan ${id} assigned to client ${clientId} by ${user.id}`);
    return result;
  }
}
