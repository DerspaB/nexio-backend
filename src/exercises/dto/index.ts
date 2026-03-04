import { z } from 'zod';

export const CreateExerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  muscleGroup: z.string().min(1),
  equipment: z.string().optional(),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export type CreateExerciseDto = z.infer<typeof CreateExerciseSchema>;

export const UpdateExerciseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  muscleGroup: z.string().min(1).optional(),
  equipment: z.string().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
});

export type UpdateExerciseDto = z.infer<typeof UpdateExerciseSchema>;

export const ExerciseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
  search: z.string().optional(),
});

export type ExerciseQueryDto = z.infer<typeof ExerciseQuerySchema>;
