import { z } from 'zod';

export const CreatePlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isTemplate: z.boolean().default(false),
  durationWeeks: z.number().int().min(1),
  clientId: z.string().uuid().optional(),
});

export type CreatePlanDto = z.infer<typeof CreatePlanSchema>;

export const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['TEMPLATE', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  durationWeeks: z.number().int().min(1).optional(),
});

export type UpdatePlanDto = z.infer<typeof UpdatePlanSchema>;

export const PlanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  isTemplate: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  status: z.enum(['TEMPLATE', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  clientId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type PlanQueryDto = z.infer<typeof PlanQuerySchema>;
