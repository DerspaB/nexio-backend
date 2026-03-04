import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { ClientsModule } from './clients/clients.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ExercisesModule } from './exercises/exercises.module';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { TodayModule } from './today/today.module';
import { UsersModule } from './users/users.module';
import { WorkoutBlocksModule } from './workout-blocks/workout-blocks.module';
import { WorkoutDaysModule } from './workout-days/workout-days.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    ExercisesModule,
    PlansModule,
    WorkoutDaysModule,
    WorkoutBlocksModule,
    TodayModule,
    CheckInsModule,
    MessagingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
