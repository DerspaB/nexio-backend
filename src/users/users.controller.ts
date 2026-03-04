import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  PaginationQueryDto,
  PaginationQuerySchema,
} from '../common/dto/pagination.dto';
import { OrganizationGuard } from '../common/guards/organization.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateUserDto,
  CreateUserSchema,
  UpdateUserDto,
  UpdateUserSchema,
} from './dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard, OrganizationGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  async findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: any,
  ) {
    const pagination: PaginationQueryDto = PaginationQuerySchema.parse(query);
    return this.usersService.findAll(organizationId, pagination);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.usersService.findOne(id, organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  async create(
    @Body() body: any,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    const dto: CreateUserDto = CreateUserSchema.parse(body);
    return this.usersService.create(dto, organizationId);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    const dto: UpdateUserDto = UpdateUserSchema.parse(body);
    return this.usersService.update(id, dto, organizationId);
  }
}
