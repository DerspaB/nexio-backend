import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'COACH']),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'COACH']).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
