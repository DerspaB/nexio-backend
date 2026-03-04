import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CheckInQueryDto,
  CheckInQuerySchema,
  CreateCheckInDto,
  CreateCheckInSchema,
} from './dto';
import { CheckInsService } from './check-ins.service';

@Controller('check-ins')
@UseGuards(RolesGuard)
export class CheckInsController {
  constructor(private checkInsService: CheckInsService) {}

  @Post()
  @Roles('CLIENT')
  async createOwn(@Body() body: any, @CurrentUser() user: any) {
    const dto: CreateCheckInDto = CreateCheckInSchema.parse(body);
    return this.checkInsService.createForCurrentUser(dto, user);
  }

  @Post(':clientId')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async createForClient(
    @Param('clientId') clientId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const dto: CreateCheckInDto = CreateCheckInSchema.parse(body);
    return this.checkInsService.createForClient(clientId, dto, user);
  }

  @Get(':clientId')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async getHistory(
    @Param('clientId') clientId: string,
    @Query() query: any,
    @CurrentUser() user: any,
  ) {
    const dto: CheckInQueryDto = CheckInQuerySchema.parse(query);
    return this.checkInsService.getHistory(clientId, dto, user);
  }
}
