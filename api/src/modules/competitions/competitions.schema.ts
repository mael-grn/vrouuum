import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const championshipCategoryParamSchema = z.object({
  id: z.coerce.number().int().positive('Championship ID must be a positive integer'),
  categoryId: z.coerce.number().int().positive('Category ID must be a positive integer'),
});

export const createChampionshipSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  logo: z.string().trim().url('Logo must be a valid URL').optional().nullable(),
  categoryIds: z.array(z.number().int().positive()).optional(),
});

export const updateChampionshipSchema = createChampionshipSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  logo: z.string().trim().url('Logo must be a valid URL').optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const linkCategorySchema = z.object({
  categoryId: z.number().int().positive('Category ID is required'),
});

export const createSeasonSchema = z.object({
  name: z.string().trim().min(1, 'Season name is required'),
});

export const updateSeasonSchema = createSeasonSchema.partial();
