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
import { OrganizationGuard } from '../common/guards/organization.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ClientQueryDto,
  ClientQuerySchema,
  CreateClientDto,
  CreateClientSchema,
  UpdateClientDto,
  UpdateClientSchema,
} from './dto';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(RolesGuard, OrganizationGuard)
@Roles('OWNER', 'ADMIN', 'COACH')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    const dto: ClientQueryDto = ClientQuerySchema.parse(query);
    return this.clientsService.findAll(dto, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientsService.findOne(id, user);
  }

  @Post()
  async create(@Body() body: any, @CurrentUser() user: any) {
    const dto: CreateClientDto = CreateClientSchema.parse(body);
    return this.clientsService.create(dto, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const dto: UpdateClientDto = UpdateClientSchema.parse(body);
    return this.clientsService.update(id, dto, user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientsService.delete(id, user);
  }
}
