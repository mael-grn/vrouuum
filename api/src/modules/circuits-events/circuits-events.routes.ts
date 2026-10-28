import { Hono } from 'hono';
import { validate } from '../../shared/utils/validator.js';
import { circuitsEventsService } from './circuits-events.service.js';
import {
  idParamSchema,
  createCircuitSchema,
  updateCircuitSchema,
  listCircuitsQuerySchema,
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  createSessionSchema,
  updateSessionSchema,
} from './circuits-events.schema.js';

export const circuitsEventsRoutes = new Hono()
  // --------------------------------------------------
  // Circuits
  // --------------------------------------------------
  .get('/circuits', validate('query', listCircuitsQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const circuitsList = await circuitsEventsService.listCircuits(query);
    return c.json({ success: true, data: circuitsList });
  })

  .get('/circuits/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const circuit = await circuitsEventsService.getCircuitById(id);
    return c.json({ success: true, data: circuit });
  })

  .post('/circuits', validate('json', createCircuitSchema), async (c) => {
    const body = c.req.valid('json');
    const circuit = await circuitsEventsService.createCircuit(body);
    return c.json({ success: true, data: circuit }, 201);
  })

  .put(
    '/circuits/:id',
    validate('param', idParamSchema),
    validate('json', updateCircuitSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await circuitsEventsService.updateCircuit(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/circuits/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await circuitsEventsService.deleteCircuit(id);
    return c.json({ success: true, data: deleted });
  })

  // --------------------------------------------------
  // Events
  // --------------------------------------------------
  .get('/events', validate('query', listEventsQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const eventsList = await circuitsEventsService.listEvents(query);
    return c.json({ success: true, data: eventsList });
  })

  .get('/events/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const event = await circuitsEventsService.getEventById(id);
    return c.json({ success: true, data: event });
  })

  .post('/events', validate('json', createEventSchema), async (c) => {
    const body = c.req.valid('json');
    const event = await circuitsEventsService.createEvent(body);
    return c.json({ success: true, data: event }, 201);
  })

  .put(
    '/events/:id',
    validate('param', idParamSchema),
    validate('json', updateEventSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await circuitsEventsService.updateEvent(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/events/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await circuitsEventsService.deleteEvent(id);
    return c.json({ success: true, data: deleted });
  })

  // --------------------------------------------------
  // Sessions
  // --------------------------------------------------
  .get('/events/:id/sessions', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const sessionsList = await circuitsEventsService.listSessionsByEvent(id);
    return c.json({ success: true, data: sessionsList });
  })

  .post(
    '/events/:id/sessions',
    validate('param', idParamSchema),
    validate('json', createSessionSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const session = await circuitsEventsService.createSession(id, body);
      return c.json({ success: true, data: session }, 201);
    }
  )

  .get('/sessions/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const session = await circuitsEventsService.getSessionById(id);
    return c.json({ success: true, data: session });
  })

  .put(
    '/sessions/:id',
    validate('param', idParamSchema),
    validate('json', updateSessionSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await circuitsEventsService.updateSession(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/sessions/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await circuitsEventsService.deleteSession(id);
    return c.json({ success: true, data: deleted });
  });
