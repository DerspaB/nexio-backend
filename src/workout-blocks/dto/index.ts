import { z } from 'zod';

const BlockTypeEnum = z.enum(['EXERCISE', 'SUPERSET', 'REST', 'NOTE']);

export const CreateWorkoutBlockSchema = z.object({
  workoutDayId: z.string().uuid(),
  type: BlockTypeEnum.default('EXERCISE'),
  exerciseId: z.string().uuid().optional().nullable(),
  order: z.number().int().min(0),
  sets: z.number().int().min(0).default(0),
  reps: z.string().default(''),
  restSeconds: z.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export type CreateWorkoutBlockDto = z.infer<typeof CreateWorkoutBlockSchema>;

export const UpdateWorkoutBlockSchema = z.object({
  type: BlockTypeEnum.optional(),
  exerciseId: z.string().uuid().optional().nullable(),
  order: z.number().int().min(0).optional(),
  sets: z.number().int().min(0).optional(),
  reps: z.string().optional(),
  restSeconds: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateWorkoutBlockDto = z.infer<typeof UpdateWorkoutBlockSchema>;

export const ReorderBlocksSchema = z.array(
  z.object({
    id: z.string().uuid(),
    order: z.number().int().min(0),
  }),
);

export type ReorderBlocksDto = z.infer<typeof ReorderBlocksSchema>;
