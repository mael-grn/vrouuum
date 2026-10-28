import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  championships,
  categories,
  championshipCategory,
  seasons,
} from '../../db/schema.js';
import { NotFoundError, ConflictError } from '../../shared/utils/errors.js';

export class CompetitionsService {
  // Championships
  async listChampionships() {
    return db.query.championships.findMany({
      with: {
        seasons: true,
        championshipCategories: {
          with: {
            category: true,
          },
        },
      },
    });
  }

  async getChampionshipById(id: number) {
    const championship = await db.query.championships.findFirst({
      where: eq(championships.id, id),
      with: {
        seasons: true,
        championshipCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!championship) {
      throw new NotFoundError(`Championship with id ${id} not found`);
    }

    return championship;
  }

  async createChampionship(data: { name: string; logo?: string | null; categoryIds?: number[] }) {
    const [inserted] = await db
      .insert(championships)
      .values({
        name: data.name,
        logo: data.logo ?? null,
      })
      .returning();

    if (data.categoryIds && data.categoryIds.length > 0) {
      await Promise.all(
        data.categoryIds.map((catId) =>
          db.insert(championshipCategory).values({
            championship_id: inserted.id,
            category_id: catId,
          })
        )
      );
    }

    return this.getChampionshipById(inserted.id);
  }

  async updateChampionship(id: number, data: { name?: string; logo?: string | null }) {
    await this.getChampionshipById(id);

    const [updated] = await db
      .update(championships)
      .set(data)
      .where(eq(championships.id, id))
      .returning();

    return updated;
  }

  async deleteChampionship(id: number) {
    await this.getChampionshipById(id);
    const [deleted] = await db.delete(championships).where(eq(championships.id, id)).returning();
    return deleted;
  }

  // Championship Categories
  async linkCategoryToChampionship(championshipId: number, categoryId: number) {
    await this.getChampionshipById(championshipId);
    await this.getCategoryById(categoryId);

    const existing = await db.query.championshipCategory.findFirst({
      where: and(
        eq(championshipCategory.championship_id, championshipId),
        eq(championshipCategory.category_id, categoryId)
      ),
    });

    if (existing) {
      throw new ConflictError('Category is already linked to this championship');
    }

    const [link] = await db
      .insert(championshipCategory)
      .values({
        championship_id: championshipId,
        category_id: categoryId,
      })
      .returning();

    return link;
  }

  async unlinkCategoryFromChampionship(championshipId: number, categoryId: number) {
    await this.getChampionshipById(championshipId);

    const [deleted] = await db
      .delete(championshipCategory)
      .where(
        and(
          eq(championshipCategory.championship_id, championshipId),
          eq(championshipCategory.category_id, categoryId)
        )
      )
      .returning();

    if (!deleted) {
      throw new NotFoundError('Category association with championship not found');
    }

    return deleted;
  }

  // Categories
  async listCategories() {
    return db.query.categories.findMany();
  }

  async getCategoryById(id: number) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      throw new NotFoundError(`Category with id ${id} not found`);
    }

    return category;
  }

  async createCategory(data: { name: string; logo?: string | null }) {
    const [inserted] = await db
      .insert(categories)
      .values({
        name: data.name,
        logo: data.logo ?? null,
      })
      .returning();

    return inserted;
  }

  async updateCategory(id: number, data: { name?: string; logo?: string | null }) {
    await this.getCategoryById(id);

    const [updated] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: number) {
    await this.getCategoryById(id);
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    return deleted;
  }

  // Seasons
  async listSeasonsByChampionship(championshipId: number) {
    await this.getChampionshipById(championshipId);

    return db.query.seasons.findMany({
      where: eq(seasons.championship_id, championshipId),
      with: {
        events: true,
      },
    });
  }

  async getSeasonById(id: number) {
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, id),
      with: {
        championship: true,
        events: {
          with: {
            circuit: true,
          },
        },
      },
    });

    if (!season) {
      throw new NotFoundError(`Season with id ${id} not found`);
    }

    return season;
  }

  async createSeason(championshipId: number, data: { name: string }) {
    await this.getChampionshipById(championshipId);

    const [inserted] = await db
      .insert(seasons)
      .values({
        championship_id: championshipId,
        name: data.name,
      })
      .returning();

    return inserted;
  }

  async updateSeason(id: number, data: { name?: string }) {
    await this.getSeasonById(id);

    const [updated] = await db
      .update(seasons)
      .set(data)
      .where(eq(seasons.id, id))
      .returning();

    return updated;
  }

  async deleteSeason(id: number) {
    await this.getSeasonById(id);
    const [deleted] = await db.delete(seasons).where(eq(seasons.id, id)).returning();
    return deleted;
  }
}

export const competitionsService = new CompetitionsService();
