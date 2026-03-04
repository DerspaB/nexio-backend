import { z } from 'zod';

export const CreateWorkoutDaySchema = z.object({
  planId: z.string().uuid(),
  dayOfWeek: z.number().int().min(1).max(7),
  name: z.string().min(1),
  order: z.number().int().min(0),
});

export type CreateWorkoutDayDto = z.infer<typeof CreateWorkoutDaySchema>;

export const UpdateWorkoutDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  name: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdateWorkoutDayDto = z.infer<typeof UpdateWorkoutDaySchema>;
