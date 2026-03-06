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
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateConversationDto,
  CreateConversationSchema,
  MessageQueryDto,
  MessageQuerySchema,
  SendMessageDto,
  SendMessageSchema,
} from './dto';
import { MessagingService } from './messaging.service';

@Controller('conversations')
@UseGuards(RolesGuard)
export class MessagingController {
  constructor(private service: MessagingService) {}

  @Get()
  getConversations(@CurrentUser() user: any) {
    return this.service.getConversations(user.id, user.organizationId);
  }

  @Post()
  createConversation(@CurrentUser() user: any, @Body() body: any) {
    const dto: CreateConversationDto = CreateConversationSchema.parse(body);
    return this.service.createConversation(user.id, user.organizationId, dto);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    const dto: MessageQueryDto = MessageQuerySchema.parse(query);
    return this.service.getMessages(id, user.id, dto);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const dto: SendMessageDto = SendMessageSchema.parse(body);
    return this.service.sendMessage(id, user.id, dto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markAsRead(id, user.id);
  }
}
