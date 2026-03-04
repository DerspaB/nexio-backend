import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TodayService } from './today.service';

@Controller('today')
@UseGuards(RolesGuard)
export class TodayController {
  constructor(private todayService: TodayService) {}

  @Get()
  @Roles('CLIENT')
  async getToday(@CurrentUser() user: any) {
    return this.todayService.getTodayForCurrentUser(user);
  }

  @Get(':clientId')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async getTodayForClient(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    return this.todayService.getTodayForClient(clientId, user);
  }
}
