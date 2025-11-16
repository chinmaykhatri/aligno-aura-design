import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').nullable(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export const emailSchema = z.string().email('Invalid email address');

export type ProjectFormData = z.infer<typeof projectSchema>;
export type ProjectUpdateData = z.infer<typeof projectUpdateSchema>;
