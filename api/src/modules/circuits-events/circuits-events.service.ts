import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { circuits, events, sessions } from '../../db/schema.js';
import { NotFoundError } from '../../shared/utils/errors.js';

export class CircuitsEventsService {
  // Circuits
  async listCircuits(filter?: { country?: string; type?: string }) {
    return db.query.circuits.findMany({
      where: (c, { and, eq }) => {
        const conditions = [];
        if (filter?.country) conditions.push(eq(c.country, filter.country));
        if (filter?.type) conditions.push(eq(c.type, filter.type));
        return conditions.length ? and(...conditions) : undefined;
      },
    });
  }

  async getCircuitById(id: number) {
    const circuit = await db.query.circuits.findFirst({
      where: eq(circuits.id, id),
      with: {
        events: true,
      },
    });

    if (!circuit) {
      throw new NotFoundError(`Circuit with id ${id} not found`);
    }

    return circuit;
  }

  async createCircuit(data: {
    name: string;
    country: string;
    length?: number | null;
    type?: string | null;
  }) {
    const [inserted] = await db
      .insert(circuits)
      .values({
        name: data.name,
        country: data.country,
        length: data.length ?? null,
        type: data.type ?? null,
      })
      .returning();

    return inserted;
  }

  async updateCircuit(
    id: number,
    data: { name?: string; country?: string; length?: number | null; type?: string | null }
  ) {
    await this.getCircuitById(id);

    const [updated] = await db
      .update(circuits)
      .set(data)
      .where(eq(circuits.id, id))
      .returning();

    return updated;
  }

  async deleteCircuit(id: number) {
    await this.getCircuitById(id);
    const [deleted] = await db.delete(circuits).where(eq(circuits.id, id)).returning();
    return deleted;
  }

  // Events
  async listEvents(filter?: { season_id?: number; circuit_id?: number }) {
    return db.query.events.findMany({
      where: (e, { and, eq }) => {
        const conditions = [];
        if (filter?.season_id) conditions.push(eq(e.season_id, filter.season_id));
        if (filter?.circuit_id) conditions.push(eq(e.circuit_id, filter.circuit_id));
        return conditions.length ? and(...conditions) : undefined;
      },
      with: {
        circuit: true,
        season: {
          with: {
            championship: true,
          },
        },
        sessions: true,
      },
    });
  }

  async getEventById(id: number) {
    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        circuit: true,
        season: {
          with: {
            championship: true,
          },
        },
        sessions: true,
        entries: {
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

    if (!event) {
      throw new NotFoundError(`Event with id ${id} not found`);
    }

    return event;
  }

  async createEvent(data: {
    season_id: number;
    circuit_id?: number | null;
    name: string;
    date?: string | null;
  }) {
    const [inserted] = await db
      .insert(events)
      .values({
        season_id: data.season_id,
        circuit_id: data.circuit_id ?? null,
        name: data.name,
        date: data.date ?? null,
      })
      .returning();

    return this.getEventById(inserted.id);
  }

  async updateEvent(
    id: number,
    data: { season_id?: number; circuit_id?: number | null; name?: string; date?: string | null }
  ) {
    await this.getEventById(id);

    const [updated] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();

    return updated;
  }

  async deleteEvent(id: number) {
    await this.getEventById(id);
    const [deleted] = await db.delete(events).where(eq(events.id, id)).returning();
    return deleted;
  }

  // Sessions
  async listSessionsByEvent(eventId: number) {
    await this.getEventById(eventId);

    return db.query.sessions.findMany({
      where: eq(sessions.event_id, eventId),
      with: {
        sessionResults: true,
      },
    });
  }

  async getSessionById(id: number) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
      with: {
        event: {
          with: {
            circuit: true,
            season: true,
          },
        },
        sessionResults: {
          with: {
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
        },
      },
    });

    if (!session) {
      throw new NotFoundError(`Session with id ${id} not found`);
    }

    return session;
  }

  async createSession(
    eventId: number,
    data: { name: string; type: string; date?: string | null }
  ) {
    await this.getEventById(eventId);

    const [inserted] = await db
      .insert(sessions)
      .values({
        event_id: eventId,
        name: data.name,
        type: data.type,
        date: data.date ?? null,
      })
      .returning();

    return inserted;
  }

  async updateSession(
    id: number,
    data: { name?: string; type?: string; date?: string | null }
  ) {
    await this.getSessionById(id);

    const [updated] = await db
      .update(sessions)
      .set(data)
      .where(eq(sessions.id, id))
      .returning();

    return updated;
  }

  async deleteSession(id: number) {
    await this.getSessionById(id);
    const [deleted] = await db.delete(sessions).where(eq(sessions.id, id)).returning();
    return deleted;
  }
}

export const circuitsEventsService = new CircuitsEventsService();
