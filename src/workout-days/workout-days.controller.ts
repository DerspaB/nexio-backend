import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateWorkoutDayDto,
  CreateWorkoutDaySchema,
  UpdateWorkoutDayDto,
  UpdateWorkoutDaySchema,
} from './dto';
import { WorkoutDaysService } from './workout-days.service';

@Controller('workout-days')
@UseGuards(RolesGuard)
export class WorkoutDaysController {
  constructor(private workoutDaysService: WorkoutDaysService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'COACH')
  async create(@Body() body: any, @CurrentUser() user: any) {
    const dto: CreateWorkoutDayDto = CreateWorkoutDaySchema.parse(body);
    return this.workoutDaysService.create(dto, user);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const dto: UpdateWorkoutDayDto = UpdateWorkoutDaySchema.parse(body);
    return this.workoutDaysService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workoutDaysService.delete(id, user);
  }
}
