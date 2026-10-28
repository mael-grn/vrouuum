import { Hono } from 'hono';
import { validate } from '../../shared/utils/validator.js';
import { paddockService } from './paddock.service.js';
import {
  idParamSchema,
  createBrandSchema,
  updateBrandSchema,
  createCarSchema,
  updateCarSchema,
  listCarsQuerySchema,
  createTeamSchema,
  updateTeamSchema,
  createPilotSchema,
  updatePilotSchema,
  listPilotsQuerySchema,
} from './paddock.schema.js';

export const paddockRoutes = new Hono()
  // --------------------------------------------------
  // Brands
  // --------------------------------------------------
  .get('/brands', async (c) => {
    const list = await paddockService.listBrands();
    return c.json({ success: true, data: list });
  })

  .get('/brands/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const brand = await paddockService.getBrandById(id);
    return c.json({ success: true, data: brand });
  })

  .post('/brands', validate('json', createBrandSchema), async (c) => {
    const body = c.req.valid('json');
    const brand = await paddockService.createBrand(body);
    return c.json({ success: true, data: brand }, 201);
  })

  .put(
    '/brands/:id',
    validate('param', idParamSchema),
    validate('json', updateBrandSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await paddockService.updateBrand(id, body);
      return c.json({ success: true, data: updated });
    }
  )
  .patch(
    '/brands/:id',
    validate('param', idParamSchema),
    validate('json', updateBrandSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await paddockService.updateBrand(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/brands/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await paddockService.deleteBrand(id);
    return c.json({ success: true, data: deleted });
  })

  // --------------------------------------------------
  // Cars
  // --------------------------------------------------
  .get('/cars', validate('query', listCarsQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const carsList = await paddockService.listCars(query);
    return c.json({ success: true, data: depthFix(carsList) });
  })

  .get('/cars/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const car = await paddockService.getCarById(id);
    return c.json({ success: true, data: car });
  })

  .post('/cars', validate('json', createCarSchema), async (c) => {
    const body = c.req.valid('json');
    const car = await paddockService.createCar(body);
    return c.json({ success: true, data: car }, 201);
  })

  .put(
    '/cars/:id',
    validate('param', idParamSchema),
    validate('json', updateCarSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await paddockService.updateCar(id, body);
      return c.json({ success: true, data: updated });
    }
  )
  .patch(
    '/cars/:id',
    validate('param', idParamSchema),
    validate('json', updateCarSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await paddockService.updateCar(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/cars/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await paddockService.deleteCar(id);
    return c.json({ success: true, data: deleted });
  })

  // --------------------------------------------------
  // Teams
  // --------------------------------------------------
  .get('/teams', async (c) => {
    const list = await paddockService.listTeams();
    return c.json({ success: true, data: list });
  })

  .get('/teams/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const team = await paddockService.getTeamById(id);
    return c.json({ success: true, data: team });
  })

  .post('/teams', validate('json', createTeamSchema), async (c) => {
    const body = c.req.valid('json');
    const team = await paddockService.createTeam(body);
    return c.json({ success: true, data: team }, 201);
  })

  .put(
    '/teams/:id',
    validate('param', idParamSchema),
    validate('json', updateTeamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await paddockService.updateTeam(id, body);
      return c.json({ success: true, data: updated });
    }
  )
  .patch(
    '/teams/:id',
    validate('param', idParamSchema),
    validate('json', updateTeamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await paddockService.updateTeam(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/teams/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await paddockService.deleteTeam(id);
    return c.json({ success: true, data: deleted });
  })

  // --------------------------------------------------
  // Pilots
  // --------------------------------------------------
  .get('/pilots', validate('query', listPilotsQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const pilotsList = await paddockService.listPilots(query);
    return c.json({ success: true, data: pilotsList });
  })

  .get('/pilots/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const pilot = await paddockService.getPilotById(id);
    return c.json({ success: true, data: pilot });
  })

  .post('/pilots', validate('json', createPilotSchema), async (c) => {
    const body = c.req.valid('json');
    const pilot = await paddockService.createPilot(body);
    return c.json({ success: true, data: pilot }, 201);
  })

  .put(
    '/pilots/:id',
    validate('param', idParamSchema),
    validate('json', updatePilotSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await paddockService.updatePilot(id, body);
      return c.json({ success: true, data: updated });
    }
  )
  .patch(
    '/pilots/:id',
    validate('param', idParamSchema),
    validate('json', updatePilotSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await paddockService.updatePilot(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/pilots/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await paddockService.deletePilot(id);
    return c.json({ success: true, data: deleted });
  });

function depthFix<T>(val: T): T {
  return val;
}
