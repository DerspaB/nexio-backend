import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from './messaging.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  firstName?: string;
  organizationId?: string;
}

@WebSocketGateway({
  namespace: '/messaging',
  cors: { origin: '*', credentials: true },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private socketUserMap = new Map<string, string>();
  private userTypingMap = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private messagingService: MessagingService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token as string ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, firstName: true, organizationId: true, isActive: true },
      });

      if (!user || !user.isActive) {
        socket.disconnect();
        return;
      }

      socket.userId = user.id;
      socket.firstName = user.firstName;
      socket.organizationId = user.organizationId;
      this.socketUserMap.set(socket.id, user.id);

      const conversations = await this.prisma.conversationParticipant.findMany({
        where: { userId: user.id },
        select: { conversationId: true },
      });

      for (const conv of conversations) {
        socket.join(`conversation:${conv.conversationId}`);
      }

      this.logger.log(`User ${user.firstName} connected (${socket.id})`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    const userId = this.socketUserMap.get(socket.id);

    if (userId) {
      const typingConversations = this.userTypingMap.get(userId);
      if (typingConversations) {
        for (const conversationId of typingConversations) {
          socket.to(`conversation:${conversationId}`).emit('typing:stop', {
            conversationId,
            userId,
          });
        }
        this.userTypingMap.delete(userId);
      }

      this.socketUserMap.delete(socket.id);
      this.logger.log(`User disconnected (${socket.id})`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    if (!socket.userId) return;

    try {
      const message = await this.messagingService.sendMessage(
        data.conversationId,
        socket.userId,
        { content: data.content },
      );

      socket.to(`conversation:${data.conversationId}`).emit('message:new', message);

      return message;
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
    }
  }

  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!socket.userId) return;

    try {
      await this.messagingService.markAsRead(data.conversationId, socket.userId);

      socket.to(`conversation:${data.conversationId}`).emit('message:read', {
        conversationId: data.conversationId,
        userId: socket.userId,
      });
    } catch (error) {
      this.logger.error(`Error marking as read: ${error.message}`);
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!socket.userId) return;

    if (!this.userTypingMap.has(socket.userId)) {
      this.userTypingMap.set(socket.userId, new Set());
    }
    this.userTypingMap.get(socket.userId)!.add(data.conversationId);

    socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: socket.userId,
      firstName: socket.firstName,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!socket.userId) return;

    this.userTypingMap.get(socket.userId)?.delete(data.conversationId);

    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: socket.userId,
    });
  }
}
