import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

// Brands
export const createBrandSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  logo: z.string().trim().url('Logo must be a valid URL').optional().nullable(),
  country: z.string().trim().optional().nullable(),
});

export const updateBrandSchema = createBrandSchema.partial();

// Cars
export const createCarSchema = z.object({
  brand_id: z.number().int().positive('brand_id is required'),
  name: z.string().trim().min(1, 'Car model name is required'),
  power: z.number().int().positive().optional().nullable(),
  weight: z.number().int().positive().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
});

export const updateCarSchema = createCarSchema.partial();

export const listCarsQuerySchema = z.object({
  brand_id: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().optional(),
});

// Teams
export const createTeamSchema = z.object({
  name: z.string().trim().min(1, 'Team name is required'),
  logo: z.string().trim().url('Logo must be a valid URL').optional().nullable(),
  country: z.string().trim().optional().nullable(),
});

export const updateTeamSchema = createTeamSchema.partial();

// Pilots
export const createPilotSchema = z.object({
  name: z.string().trim().min(1, 'First name is required'),
  surname: z.string().trim().min(1, 'Surname is required'),
  country: z.string().trim().optional().nullable(),
  photo: z.string().trim().url('Photo must be a valid URL').optional().nullable().or(z.literal('')),
});

export const updatePilotSchema = createPilotSchema.partial();

export const listPilotsQuerySchema = z.object({
  country: z.string().optional(),
  search: z.string().optional(),
});
