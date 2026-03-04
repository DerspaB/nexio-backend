import { z } from 'zod';

export const CreateConversationSchema = z.object({
  participantId: z.string().uuid(),
});

export type CreateConversationDto = z.infer<typeof CreateConversationSchema>;

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;

export const MessageQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type MessageQueryDto = z.infer<typeof MessageQuerySchema>;
