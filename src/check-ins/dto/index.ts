import { z } from 'zod';

export const CreateCheckInSchema = z.object({
  date: z.coerce.date(),
  status: z.enum(['COMPLETED', 'PARTIAL', 'SKIPPED']),
  workoutDayId: z.string().uuid().optional(),
  completedBlocks: z.number().int().min(0),
  totalBlocks: z.number().int().min(0),
  notes: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
});

export type CreateCheckInDto = z.infer<typeof CreateCheckInSchema>;

export const CheckInQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CheckInQueryDto = z.infer<typeof CheckInQuerySchema>;
