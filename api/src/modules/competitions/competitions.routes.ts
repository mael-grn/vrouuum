import { Hono } from 'hono';
import { validate } from '../../shared/utils/validator.js';
import { competitionsService } from './competitions.service.js';
import {
  idParamSchema,
  championshipCategoryParamSchema,
  createChampionshipSchema,
  updateChampionshipSchema,
  createCategorySchema,
  updateCategorySchema,
  linkCategorySchema,
  createSeasonSchema,
  updateSeasonSchema,
} from './competitions.schema.js';

export const competitionsRoutes = new Hono()
  // --------------------------------------------------
  // Championships
  // --------------------------------------------------
  .get('/championships', async (c) => {
    const list = await competitionsService.listChampionships();
    return c.json({ success: true, data: list });
  })

  .get('/championships/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const championship = await competitionsService.getChampionshipById(id);
    return c.json({ success: true, data: championship });
  })

  .post('/championships', validate('json', createChampionshipSchema), async (c) => {
    const body = c.req.valid('json');
    const championship = await competitionsService.createChampionship(body);
    return c.json({ success: true, data: championship }, 201);
  })

  .put(
    '/championships/:id',
    validate('param', idParamSchema),
    validate('json', updateChampionshipSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await competitionsService.updateChampionship(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/championships/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await competitionsService.deleteChampionship(id);
    return c.json({ success: true, data: deleted });
  })

  // --------------------------------------------------
  // Championship Categories association
  // --------------------------------------------------
  .post(
    '/championships/:id/categories',
    validate('param', idParamSchema),
    validate('json', linkCategorySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const { categoryId } = c.req.valid('json');
      const link = await competitionsService.linkCategoryToChampionship(id, categoryId);
      return c.json({ success: true, data: link }, 201);
    }
  )

  .delete(
    '/championships/:id/categories/:categoryId',
    validate('param', championshipCategoryParamSchema),
    async (c) => {
      const { id, categoryId } = c.req.valid('param');
      const deleted = await competitionsService.unlinkCategoryFromChampionship(id, categoryId);
      return c.json({ success: true, data: deleted });
    }
  )

  // --------------------------------------------------
  // Standalone Categories
  // --------------------------------------------------
  .get('/categories', async (c) => {
    const list = await competitionsService.listCategories();
    return c.json({ success: true, data: list });
  })

  .get('/categories/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const category = await competitionsService.getCategoryById(id);
    return c.json({ success: true, data: category });
  })

  .post('/categories', validate('json', createCategorySchema), async (c) => {
    const body = c.req.valid('json');
    const category = await competitionsService.createCategory(body);
    return c.json({ success: true, data: category }, 201);
  })

  .put(
    '/categories/:id',
    validate('param', idParamSchema),
    validate('json', updateCategorySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await competitionsService.updateCategory(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/categories/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await competitionsService.deleteCategory(id);
    return c.json({ success: true, data: deleted });
  })

  // --------------------------------------------------
  // Seasons
  // --------------------------------------------------
  .get('/championships/:id/seasons', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const seasonsList = await competitionsService.listSeasonsByChampionship(id);
    return c.json({ success: true, data: seasonsList });
  })

  .post(
    '/championships/:id/seasons',
    validate('param', idParamSchema),
    validate('json', createSeasonSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const season = await competitionsService.createSeason(id, body);
      return c.json({ success: true, data: season }, 201);
    }
  )

  .get('/seasons/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const season = await competitionsService.getSeasonById(id);
    return c.json({ success: true, data: season });
  })

  .put(
    '/seasons/:id',
    validate('param', idParamSchema),
    validate('json', updateSeasonSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const updated = await competitionsService.updateSeason(id, body);
      return c.json({ success: true, data: updated });
    }
  )

  .delete('/seasons/:id', validate('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await competitionsService.deleteSeason(id);
    return c.json({ success: true, data: deleted });
  });
