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
  CreateExerciseDto,
  CreateExerciseSchema,
  ExerciseQueryDto,
  ExerciseQuerySchema,
  UpdateExerciseDto,
  UpdateExerciseSchema,
} from './dto';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
@UseGuards(RolesGuard)
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'COACH')
  async findAll(
    @Query() query: any,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    const dto: ExerciseQueryDto = ExerciseQuerySchema.parse(query);
    return this.exercisesService.findAll(dto, organizationId);
  }

  @Get('muscle-groups')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async findMuscleGroups(
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.exercisesService.findMuscleGroups(organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.exercisesService.findOne(id, organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'COACH')
  async create(
    @Body() body: any,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    const dto: CreateExerciseDto = CreateExerciseSchema.parse(body);
    return this.exercisesService.create(dto, organizationId);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'COACH')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const dto: UpdateExerciseDto = UpdateExerciseSchema.parse(body);
    return this.exercisesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.exercisesService.delete(id, user);
  }
}
