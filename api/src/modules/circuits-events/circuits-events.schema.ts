import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

// Circuits
export const createCircuitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  country: z.string().trim().min(1, 'Country is required'),
  length: z.number().positive('Length must be positive').optional().nullable(),
  type: z.string().trim().optional().nullable(),
});

export const updateCircuitSchema = createCircuitSchema.partial();

export const listCircuitsQuerySchema = z.object({
  country: z.string().optional(),
  type: z.string().optional(),
});

// Events
export const createEventSchema = z.object({
  season_id: z.number().int().positive('season_id is required'),
  circuit_id: z.number().int().positive().optional().nullable(),
  name: z.string().trim().min(1, 'Event name is required'),
  date: z.string().trim().optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

export const listEventsQuerySchema = z.object({
  season_id: z.coerce.number().int().positive().optional(),
  circuit_id: z.coerce.number().int().positive().optional(),
});

// Sessions
export const createSessionSchema = z.object({
  name: z.string().trim().min(1, 'Session name is required'),
  type: z.string().trim().min(1, 'Session type is required (e.g. practice, qualifying, race)'),
  date: z.string().trim().optional().nullable(),
});

export const updateSessionSchema = createSessionSchema.partial();
