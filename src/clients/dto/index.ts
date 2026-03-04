import { z } from 'zod';

export const CreateClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  coachId: z.string().uuid().optional(),
});

export type CreateClientDto = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PAUSED']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateClientDto = z.infer<typeof UpdateClientSchema>;

export const ClientQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional(),
  search: z.string().optional(),
  coachId: z.string().uuid().optional(),
});

export type ClientQueryDto = z.infer<typeof ClientQuerySchema>;
