import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, MessageQueryDto, SendMessageDto } from './dto';
import { MessagingRepository } from './messaging.repository';

@Injectable()
export class MessagingService {
  constructor(
    private repository: MessagingRepository,
    private prisma: PrismaService,
  ) {}

  async getConversations(userId: string, organizationId: string) {
    const conversations = await this.repository.findConversationsByUserId(userId, organizationId);

    return conversations.map((conv) => {
      const currentParticipant = conv.participants.find((p) => p.userId === userId);
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        organizationId: conv.organizationId,
        lastMessageAt: conv.lastMessageAt,
        participants: conv.participants,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              conversationId: lastMessage.conversationId,
              senderId: lastMessage.senderId,
              sender: lastMessage.sender,
              content: lastMessage.content,
              type: lastMessage.type,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount: currentParticipant?.unreadCount ?? 0,
        createdAt: conv.createdAt,
      };
    });
  }

  async getMessages(conversationId: string, userId: string, query: MessageQueryDto) {
    await this.validateParticipant(conversationId, userId);
    return this.repository.findMessages(conversationId, query.page, query.limit);
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    await this.validateParticipant(conversationId, userId);
    return this.repository.createMessage(conversationId, userId, dto.content);
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.validateParticipant(conversationId, userId);
    await this.repository.markAsRead(conversationId, userId);
    return { success: true };
  }

  async createConversation(userId: string, organizationId: string, dto: CreateConversationDto) {
    if (dto.participantId === userId) {
      throw new ForbiddenException('Cannot create conversation with yourself');
    }

    const participant = await this.prisma.user.findUnique({
      where: { id: dto.participantId },
      select: { id: true, organizationId: true },
    });

    if (!participant || participant.organizationId !== organizationId) {
      throw new NotFoundException('Participant not found in your organization');
    }

    const existing = await this.repository.findExistingConversation(
      userId,
      dto.participantId,
      organizationId,
    );

    if (existing) {
      return existing;
    }

    return this.repository.createConversation(organizationId, [userId, dto.participantId]);
  }

  private async validateParticipant(conversationId: string, userId: string) {
    const conversation = await this.repository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = await this.repository.isParticipant(conversationId, userId);

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
  }
}
