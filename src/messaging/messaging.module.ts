import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { MessagingRepository } from './messaging.repository';
import { MessagingService } from './messaging.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingRepository, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
