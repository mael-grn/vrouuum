import { eq, and, asc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  entries,
  entryPilot,
  sessionResults,
  events,
  teams,
  cars,
  categories,
  pilots,
  sessions,
} from '../../db/schema.js';
import { NotFoundError, ConflictError } from '../../shared/utils/errors.js';

export class RacingService {
  // --------------------------------------------------
  // Entries
  // --------------------------------------------------
  async listEntriesByEvent(eventId: number) {
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    if (!event) {
      throw new NotFoundError(`Event with id ${eventId} not found`);
    }

    return db.query.entries.findMany({
      where: eq(entries.event_id, eventId),
      with: {
        team: true,
        car: {
          with: {
            brand: true,
          },
        },
        category: true,
        entryPilots: {
          with: {
            pilot: true,
          },
        },
      },
    });
  }

  async getEntryById(id: number) {
    const entry = await db.query.entries.findFirst({
      where: eq(entries.id, id),
      with: {
        event: {
          with: {
            circuit: true,
            season: true,
          },
        },
        team: true,
        car: {
          with: {
            brand: true,
          },
        },
        category: true,
        entryPilots: {
          with: {
            pilot: true,
          },
        },
        sessionResults: true,
      },
    });

    if (!entry) {
      throw new NotFoundError(`Entry with id ${id} not found`);
    }

    return entry;
  }

  async createEntry(
    eventId: number,
    data: {
      team_id: number;
      car_id: number;
      category_id: number;
      number: string;
      pilot_ids?: number[];
    }
  ) {
    // Verify parent foreign key existence
    const [event, team, car, category] = await Promise.all([
      db.query.events.findFirst({ where: eq(events.id, eventId) }),
      db.query.teams.findFirst({ where: eq(teams.id, data.team_id) }),
      db.query.cars.findFirst({ where: eq(cars.id, data.car_id) }),
      db.query.categories.findFirst({ where: eq(categories.id, data.category_id) }),
    ]);

    if (!event) throw new NotFoundError(`Event with id ${eventId} not found`);
    if (!team) throw new NotFoundError(`Team with id ${data.team_id} not found`);
    if (!car) throw new NotFoundError(`Car with id ${data.car_id} not found`);
    if (!category) throw new NotFoundError(`Category with id ${data.category_id} not found`);

    // Verify pilots if provided
    if (data.pilot_ids && data.pilot_ids.length > 0) {
      for (const pilotId of data.pilot_ids) {
        const pilot = await db.query.pilots.findFirst({ where: eq(pilots.id, pilotId) });
        if (!pilot) {
          throw new NotFoundError(`Pilot with id ${pilotId} not found`);
        }
      }
    }

    const [inserted] = await db
      .insert(entries)
      .values({
        event_id: eventId,
        team_id: data.team_id,
        car_id: data.car_id,
        category_id: data.category_id,
        number: data.number,
      })
      .returning();

    if (data.pilot_ids && data.pilot_ids.length > 0) {
      await Promise.all(
        data.pilot_ids.map((pilotId) =>
          db.insert(entryPilot).values({
            entry_id: inserted.id,
            pilot_id: pilotId,
          })
        )
      );
    }

    return this.getEntryById(inserted.id);
  }

  async updateEntry(
    id: number,
    data: {
      event_id?: number;
      team_id?: number;
      car_id?: number;
      category_id?: number;
      number?: string;
    }
  ) {
    await this.getEntryById(id);

    if (data.event_id) {
      const event = await db.query.events.findFirst({ where: eq(events.id, data.event_id) });
      if (!event) throw new NotFoundError(`Event with id ${data.event_id} not found`);
    }
    if (data.team_id) {
      const team = await db.query.teams.findFirst({ where: eq(teams.id, data.team_id) });
      if (!team) throw new NotFoundError(`Team with id ${data.team_id} not found`);
    }
    if (data.car_id) {
      const car = await db.query.cars.findFirst({ where: eq(cars.id, data.car_id) });
      if (!car) throw new NotFoundError(`Car with id ${data.car_id} not found`);
    }
    if (data.category_id) {
      const cat = await db.query.categories.findFirst({ where: eq(categories.id, data.category_id) });
      if (!cat) throw new NotFoundError(`Category with id ${data.category_id} not found`);
    }

    const [updated] = await db
      .update(entries)
      .set(data)
      .where(eq(entries.id, id))
      .returning();

    return updated;
  }

  async deleteEntry(id: number) {
    await this.getEntryById(id);
    const [deleted] = await db.delete(entries).where(eq(entries.id, id)).returning();
    return deleted;
  }

  // --------------------------------------------------
  // Entry Pilots (Crew)
  // --------------------------------------------------
  async addPilotToEntry(entryId: number, pilotId: number) {
    await this.getEntryById(entryId);

    const pilot = await db.query.pilots.findFirst({ where: eq(pilots.id, pilotId) });
    if (!pilot) {
      throw new NotFoundError(`Pilot with id ${pilotId} not found`);
    }

    const existing = await db.query.entryPilot.findFirst({
      where: and(eq(entryPilot.entry_id, entryId), eq(entryPilot.pilot_id, pilotId)),
    });

    if (existing) {
      throw new ConflictError('Pilot is already assigned to this entry');
    }

    const [assignment] = await db
      .insert(entryPilot)
      .values({
        entry_id: entryId,
        pilot_id: pilotId,
      })
      .returning();

    return assignment;
  }

  async removePilotFromEntry(entryId: number, pilotId: number) {
    await this.getEntryById(entryId);

    const [deleted] = await db
      .delete(entryPilot)
      .where(and(eq(entryPilot.entry_id, entryId), eq(entryPilot.pilot_id, pilotId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Pilot assignment on this entry not found');
    }

    return deleted;
  }

  // --------------------------------------------------
  // Session Results & Timing
  // --------------------------------------------------
  async listResultsBySession(sessionId: number) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!session) {
      throw new NotFoundError(`Session with id ${sessionId} not found`);
    }

    return db.query.sessionResults.findMany({
      where: eq(sessionResults.session_id, sessionId),
      orderBy: [asc(sessionResults.position)],
      with: {
        entry: {
          with: {
            team: true,
            car: {
              with: {
                brand: true,
              },
            },
            category: true,
            entryPilots: {
              with: {
                pilot: true,
              },
            },
          },
        },
      },
    });
  }

  async getResultById(id: number) {
    const result = await db.query.sessionResults.findFirst({
      where: eq(sessionResults.id, id),
      with: {
        session: true,
        entry: {
          with: {
            team: true,
            car: true,
            category: true,
            entryPilots: {
              with: {
                pilot: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundError(`Session result with id ${id} not found`);
    }

    return result;
  }

  async createSessionResult(
    sessionId: number,
    data: {
      entry_id: number;
      number?: string | null;
      status?: string | null;
      position?: number | null;
      laps_completed?: number | null;
      total_time?: string | null;
      best_lap?: string | null;
      point_gained?: number | null;
    }
  ) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!session) {
      throw new NotFoundError(`Session with id ${sessionId} not found`);
    }

    const entry = await db.query.entries.findFirst({
      where: eq(entries.id, data.entry_id),
    });
    if (!entry) {
      throw new NotFoundError(`Entry with id ${data.entry_id} not found`);
    }

    // Default number to entry number if not explicitly specified
    const resultNumber = data.number ?? entry.number;

    const [inserted] = await db
      .insert(sessionResults)
      .values({
        session_id: sessionId,
        entry_id: data.entry_id,
        number: resultNumber,
        status: data.status ?? null,
        position: data.position ?? null,
        laps_completed: data.laps_completed ?? null,
        total_time: data.total_time ?? null,
        best_lap: data.best_lap ?? null,
        point_gained: data.point_gained ?? null,
      })
      .returning();

    return this.getResultById(inserted.id);
  }

  async batchCreateSessionResults(
    sessionId: number,
    resultsList: Array<{
      entry_id: number;
      number?: string | null;
      status?: string | null;
      position?: number | null;
      laps_completed?: number | null;
      total_time?: string | null;
      best_lap?: string | null;
      point_gained?: number | null;
    }>
  ) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!session) {
      throw new NotFoundError(`Session with id ${sessionId} not found`);
    }

    const created = [];
    for (const item of resultsList) {
      const res = await this.createSessionResult(sessionId, item);
      created.push(res);
    }

    return created;
  }

  async updateSessionResult(
    id: number,
    data: {
      number?: string | null;
      status?: string | null;
      position?: number | null;
      laps_completed?: number | null;
      total_time?: string | null;
      best_lap?: string | null;
      point_gained?: number | null;
    }
  ) {
    await this.getResultById(id);

    const [updated] = await db
      .update(sessionResults)
      .set(data)
      .where(eq(sessionResults.id, id))
      .returning();

    return updated;
  }

  async deleteSessionResult(id: number) {
    await this.getResultById(id);
    const [deleted] = await db.delete(sessionResults).where(eq(sessionResults.id, id)).returning();
    return deleted;
  }
}

export const racingService = new RacingService();
