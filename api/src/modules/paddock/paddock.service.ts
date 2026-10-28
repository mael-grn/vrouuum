import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { brands, cars, teams, pilots } from '../../db/schema.js';
import { NotFoundError } from '../../shared/utils/errors.js';

export class PaddockService {
  // Brands
  async listBrands() {
    return db.query.brands.findMany({
      with: {
        cars: true,
      },
    });
  }

  async getBrandById(id: number) {
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
      with: {
        cars: true,
      },
    });

    if (!brand) {
      throw new NotFoundError(`Brand with id ${id} not found`);
    }

    return brand;
  }

  async createBrand(data: { name: string; logo?: string | null; country?: string | null }) {
    const [inserted] = await db
      .insert(brands)
      .values({
        name: data.name,
        logo: data.logo ?? null,
        country: data.country ?? null,
      })
      .returning();

    return inserted;
  }

  async updateBrand(
    id: number,
    data: { name?: string; logo?: string | null; country?: string | null }
  ) {
    await this.getBrandById(id);

    const [updated] = await db
      .update(brands)
      .set(data)
      .where(eq(brands.id, id))
      .returning();

    return updated;
  }

  async deleteBrand(id: number) {
    await this.getBrandById(id);
    const [deleted] = await db.delete(brands).where(eq(brands.id, id)).returning();
    return deleted;
  }

  // Cars
  async listCars(filter?: { brand_id?: number; year?: number }) {
    return db.query.cars.findMany({
      where: (c, { and, eq }) => {
        const conditions = [];
        if (filter?.brand_id) conditions.push(eq(c.brand_id, filter.brand_id));
        if (filter?.year) conditions.push(eq(c.year, filter.year));
        return conditions.length ? and(...conditions) : undefined;
      },
      with: {
        brand: true,
      },
    });
  }

  async getCarById(id: number) {
    const car = await db.query.cars.findFirst({
      where: eq(cars.id, id),
      with: {
        brand: true,
      },
    });

    if (!car) {
      throw new NotFoundError(`Car with id ${id} not found`);
    }

    return car;
  }

  async createCar(data: {
    brand_id: number;
    name: string;
    power?: number | null;
    weight?: number | null;
    year?: number | null;
  }) {
    // Check if brand exists
    await this.getBrandById(data.brand_id);

    const [inserted] = await db
      .insert(cars)
      .values({
        brand_id: data.brand_id,
        name: data.name,
        power: data.power ?? null,
        weight: data.weight ?? null,
        year: data.year ?? null,
      })
      .returning();

    return this.getCarById(inserted.id);
  }

  async updateCar(
    id: number,
    data: {
      brand_id?: number;
      name?: string;
      power?: number | null;
      weight?: number | null;
      year?: number | null;
    }
  ) {
    await this.getCarById(id);

    if (data.brand_id) {
      await this.getBrandById(data.brand_id);
    }

    const [updated] = await db
      .update(cars)
      .set(data)
      .where(eq(cars.id, id))
      .returning();

    return updated;
  }

  async deleteCar(id: number) {
    await this.getCarById(id);
    const [deleted] = await db.delete(cars).where(eq(cars.id, id)).returning();
    return deleted;
  }

  // Teams
  async listTeams() {
    return db.query.teams.findMany({
      with: {
        entries: {
          with: {
            car: true,
            category: true,
          },
        },
      },
    });
  }

  async getTeamById(id: number) {
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, id),
      with: {
        entries: {
          with: {
            car: true,
            category: true,
            event: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError(`Team with id ${id} not found`);
    }

    return team;
  }

  async createTeam(data: { name: string; logo?: string | null; country?: string | null }) {
    const [inserted] = await db
      .insert(teams)
      .values({
        name: data.name,
        logo: data.logo ?? null,
        country: data.country ?? null,
      })
      .returning();

    return inserted;
  }

  async updateTeam(
    id: number,
    data: { name?: string; logo?: string | null; country?: string | null }
  ) {
    await this.getTeamById(id);

    const [updated] = await db
      .update(teams)
      .set(data)
      .where(eq(teams.id, id))
      .returning();

    return updated;
  }

  async deleteTeam(id: number) {
    await this.getTeamById(id);
    const [deleted] = await db.delete(teams).where(eq(teams.id, id)).returning();
    return deleted;
  }

  // Pilots
  async listPilots(filter?: { country?: string; search?: string }) {
    return db.query.pilots.findMany({
      where: (p, { and, eq, or, ilike }) => {
        const conditions = [];
        if (filter?.country) conditions.push(eq(p.country, filter.country));
        if (filter?.search) {
          conditions.push(
            or(ilike(p.name, `%${filter.search}%`), ilike(p.surname, `%${filter.search}%`))
          );
        }
        return conditions.length ? and(...conditions) : undefined;
      },
      with: {
        entryPilots: true,
      },
    });
  }

  async getPilotById(id: number) {
    const pilot = await db.query.pilots.findFirst({
      where: eq(pilots.id, id),
      with: {
        entryPilots: {
          with: {
            entry: {
              with: {
                car: true,
                team: true,
                event: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!pilot) {
      throw new NotFoundError(`Pilot with id ${id} not found`);
    }

    return pilot;
  }

  async createPilot(data: { name: string; surname: string; country?: string | null; photo?: string | null }) {
    const [inserted] = await db
      .insert(pilots)
      .values({
        name: data.name,
        surname: data.surname,
        country: data.country ?? null,
        photo: data.photo ?? null,
      })
      .returning();

    return inserted;
  }

  async updatePilot(
    id: number,
    data: { name?: string; surname?: string; country?: string | null; photo?: string | null }
  ) {
    await this.getPilotById(id);

    const [updated] = await db
      .update(pilots)
      .set(data)
      .where(eq(pilots.id, id))
      .returning();

    return updated;
  }

  async deletePilot(id: number) {
    await this.getPilotById(id);
    const [deleted] = await db.delete(pilots).where(eq(pilots.id, id)).returning();
    return deleted;
  }
}

export const paddockService = new PaddockService();
