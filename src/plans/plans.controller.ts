import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreatePlanDto,
  CreatePlanSchema,
  PlanQueryDto,
  PlanQuerySchema,
  UpdatePlanDto,
  UpdatePlanSchema,
} from './dto';
import { PlansService } from './plans.service';

@Controller('plans')
@UseGuards(RolesGuard)
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'COACH')
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    const dto: PlanQueryDto = PlanQuerySchema.parse(query);
    return this.plansService.findAll(dto, user);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.plansService.findOne(id, user);
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'COACH')
  async create(@Body() body: any, @CurrentUser() user: any) {
    const dto: CreatePlanDto = CreatePlanSchema.parse(body);
    return this.plansService.create(dto, user);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const dto: UpdatePlanDto = UpdatePlanSchema.parse(body);
    return this.plansService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.plansService.delete(id, user);
  }

  @Post(':id/duplicate')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async duplicate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.plansService.duplicate(id, user);
  }

  @Post(':id/assign/:clientId')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async assign(
    @Param('id') id: string,
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    return this.plansService.assign(id, clientId, user);
  }
}
