import { Module } from '@nestjs/common';
import { TodayController } from './today.controller';
import { TodayService } from './today.service';

@Module({
  controllers: [TodayController],
  providers: [TodayService],
  exports: [TodayService],
})
export class TodayModule {}
