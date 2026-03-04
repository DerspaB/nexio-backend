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
  CreateWorkoutBlockDto,
  CreateWorkoutBlockSchema,
  ReorderBlocksDto,
  ReorderBlocksSchema,
  UpdateWorkoutBlockDto,
  UpdateWorkoutBlockSchema,
} from './dto';
import { WorkoutBlocksService } from './workout-blocks.service';

@Controller('workout-blocks')
@UseGuards(RolesGuard)
export class WorkoutBlocksController {
  constructor(private workoutBlocksService: WorkoutBlocksService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'COACH')
  async create(@Body() body: any, @CurrentUser() user: any) {
    const dto: CreateWorkoutBlockDto = CreateWorkoutBlockSchema.parse(body);
    return this.workoutBlocksService.create(dto, user);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const dto: UpdateWorkoutBlockDto = UpdateWorkoutBlockSchema.parse(body);
    return this.workoutBlocksService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workoutBlocksService.delete(id, user);
  }

  @Post('reorder')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async reorder(@Body() body: any, @CurrentUser() user: any) {
    const dto: ReorderBlocksDto = ReorderBlocksSchema.parse(body);
    return this.workoutBlocksService.reorder(dto, user);
  }
}
