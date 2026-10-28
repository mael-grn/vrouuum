import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const eventIdParamSchema = z.object({
  eventId: z.coerce.number().int().positive('eventId must be a positive integer'),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.coerce.number().int().positive('sessionId must be a positive integer'),
});

export const entryPilotParamSchema = z.object({
  id: z.coerce.number().int().positive('Entry ID must be a positive integer'),
  pilotId: z.coerce.number().int().positive('Pilot ID must be a positive integer'),
});

// Entries
export const createEntrySchema = z.object({
  team_id: z.number().int().positive('team_id is required'),
  car_id: z.number().int().positive('car_id is required'),
  category_id: z.number().int().positive('category_id is required'),
  number: z.string().trim().min(1, 'Race number is required (e.g. "#51", "#7")'),
  pilot_ids: z.array(z.number().int().positive()).optional(),
});

export const updateEntrySchema = z.object({
  event_id: z.number().int().positive().optional(),
  team_id: z.number().int().positive().optional(),
  car_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().optional(),
  number: z.string().trim().min(1).optional(),
});

export const addPilotToEntrySchema = z.object({
  pilot_id: z.number().int().positive('pilot_id is required'),
});

// Session Results
export const createSessionResultSchema = z.object({
  entry_id: z.number().int().positive('entry_id is required'),
  number: z.string().trim().optional().nullable(),
  status: z.string().trim().optional().nullable(), // Finished, DNF, DSQ, DNS
  position: z.number().int().positive().optional().nullable(),
  laps_completed: z.number().int().min(0).optional().nullable(),
  total_time: z.string().trim().optional().nullable(),
  best_lap: z.string().trim().optional().nullable(),
  point_gained: z.number().min(0).optional().nullable(),
});

export const batchCreateSessionResultsSchema = z.object({
  results: z.array(createSessionResultSchema).min(1, 'At least one result is required'),
});

export const updateSessionResultSchema = createSessionResultSchema.partial().omit({ entry_id: true });
