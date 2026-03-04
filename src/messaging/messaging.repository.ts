import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingRepository {
  constructor(private prisma: PrismaService) {}

  async findConversationsByUserId(userId: string, organizationId: string) {
    return this.prisma.conversation.findMany({
      where: {
        organizationId,
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });
  }

  async findConversationById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findExistingConversation(userIdA: string, userIdB: string, organizationId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        organizationId,
        AND: [
          { participants: { some: { userId: userIdA } } },
          { participants: { some: { userId: userIdB } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async createConversation(organizationId: string, userIds: string[]) {
    return this.prisma.conversation.create({
      data: {
        organizationId,
        participants: {
          create: userIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findMessages(conversationId: string, page: number, limit: number) {
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createMessage(conversationId: string, senderId: string, content: string) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversationId, senderId, content },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      await tx.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId: { not: senderId },
        },
        data: { unreadCount: { increment: 1 } },
      });

      return message;
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    return !!participant;
  }

  async getParticipantUnreadCount(conversationId: string, userId: string): Promise<number> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { unreadCount: true },
    });
    return participant?.unreadCount ?? 0;
  }
}
