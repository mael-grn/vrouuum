import { Hono } from 'hono';
import { validate } from '../../shared/utils/validator.js';
import { racingService } from './racing.service.js';
import {
  idParamSchema,
  eventIdParamSchema,
  sessionIdParamSchema,
  entryPilotParamSchema,
  createEntrySchema,
  updateEntrySchema,
  addPilotToEntrySchema,
  createSessionResultSchema,
  batchCreateSessionResultsSchema,
  updateSessionResultSchema,
} from './racing.schema.js';

export const racingRoutes = new Hono()
  // --------------------------------------------------
  // Entries (Engagements)
  // --------------------------------------------------
  .get('/events/:eventId/entries', validate('param', eventIdParamSchema), async (c) => {
    const { eventId } = c.req.valid('param');
    const entriesList = await racingService.listEntriesByEvent(eventId);
    return c.json({ success: true, data: entriesList });
  })

  .post(
    '/events/:eventId/entries',
    validate('param', eventIdParamSchema),
    validate('json', createEntrySchema),
    async (c) => {
      const { eventId } = c.req.valid('param');
      const body = c.req.valid('json');
      const entry = await racingService.createEntry(eventId, body);
      return c.json({ success: true, data: entry }, 201);
    }
  )

  .get('/entries/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const entry = await racingService.getEntryById(id);
    return c.json({ success: true, data: entry });
  })

  .put(
    '/entries/:id',
    validate('param', idParamSchema),
    validate('json', updateEntrySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await racingService.updateEntry(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/entries/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await racingService.deleteEntry(id);
    return c.json({ success: true, data: deleted });
  })

  // --------------------------------------------------
  // Crew Pilots Management on an Entry
  // --------------------------------------------------
  .post(
    '/entries/:id/pilots',
    validate('param', idParamSchema),
    validate('json', addPilotToEntrySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const { pilot_id } = c.req.valid('json');
      const assignment = await racingService.addPilotToEntry(id, pilot_id);
      return c.json({ success: true, data: assignment }, 201);
    }
  )

  .delete(
    '/entries/:id/pilots/:pilotId',
    validate('param', entryPilotParamSchema),
    async (c) => {
      const { id, pilotId } = c.req.valid('param');
      const deleted = await racingService.removePilotFromEntry(id, pilotId);
      return c.json({ success: true, data: deleted });
    }
  )

  // --------------------------------------------------
  // Session Results & Timing
  // --------------------------------------------------
  .get('/sessions/:sessionId/results', validate('param', sessionIdParamSchema), async (c) => {
    const { sessionId } = c.req.valid('param');
    const results = await racingService.listResultsBySession(sessionId);
    return c.json({ success: true, data: results });
  })

  .post(
    '/sessions/:sessionId/results',
    validate('param', sessionIdParamSchema),
    validate('json', createSessionResultSchema),
    async (c) => {
      const { sessionId } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await racingService.createSessionResult(sessionId, body);
      return c.json({ success: true, data: result }, 201);
    }
  )

  .post(
    '/sessions/:sessionId/results/batch',
    validate('param', sessionIdParamSchema),
    validate('json', batchCreateSessionResultsSchema),
    async (c) => {
      const { sessionId } = c.req.valid('param');
      const { results } = c.req.valid('json');
      const createdList = await racingService.batchCreateSessionResults(sessionId, results);
      return c.json({ success: true, data: createdList }, 201);
    }
  )

  .get('/results/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const result = await racingService.getResultById(id);
    return c.json({ success: true, data: result });
  })

  .put(
    '/results/:id',
    validate('param', idParamSchema),
    validate('json', updateSessionResultSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await racingService.updateSessionResult(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/results/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await racingService.deleteSessionResult(id);
    return c.json({ success: true, data: deleted });
  });
