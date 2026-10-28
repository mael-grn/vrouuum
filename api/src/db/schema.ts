import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// A. Hiérarchie Championnat & Calendrier
// ----------------------------------------------------

export const championships = pgTable('championships', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
});

export const championshipCategory = pgTable('championship_category', {
  id: serial('id').primaryKey(),
  championship_id: integer('championship_id')
    .notNull()
    .references(() => championships.id, { onDelete: 'cascade' }),
  category_id: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
});

export const seasons = pgTable('seasons', {
  id: serial('id').primaryKey(),
  championship_id: integer('championship_id')
    .notNull()
    .references(() => championships.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export const circuits = pgTable('circuits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  length: doublePrecision('length'),
  type: text('type'),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  season_id: integer('season_id')
    .notNull()
    .references(() => seasons.id, { onDelete: 'cascade' }),
  circuit_id: integer('circuit_id')
    .references(() => circuits.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  date: timestamp('date', { withTimezone: true, mode: 'string' }),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  date: timestamp('date', { withTimezone: true, mode: 'string' }),
});

// ----------------------------------------------------
// B. Constructeurs, Véhicules & Participants
// ----------------------------------------------------

export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  country: text('country'),
});

export const cars = pgTable('cars', {
  id: serial('id').primaryKey(),
  brand_id: integer('brand_id')
    .notNull()
    .references(() => brands.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  power: integer('power'),
  weight: integer('weight'),
  year: integer('year'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  country: text('country'),
});

export const pilots = pgTable('pilots', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  country: text('country'),
  photo: text('photo'),
});

// ----------------------------------------------------
// C. Engagements & Résultats de Course
// ----------------------------------------------------

export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  team_id: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  car_id: integer('car_id')
    .notNull()
    .references(() => cars.id, { onDelete: 'cascade' }),
  category_id: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  number: text('number').notNull(),
});

export const entryPilot = pgTable('entry_pilot', {
  id: serial('id').primaryKey(),
  entry_id: integer('entry_id')
    .notNull()
    .references(() => entries.id, { onDelete: 'cascade' }),
  pilot_id: integer('pilot_id')
    .notNull()
    .references(() => pilots.id, { onDelete: 'cascade' }),
});

export const sessionResults = pgTable('session_results', {
  id: serial('id').primaryKey(),
  session_id: integer('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  entry_id: integer('entry_id')
    .notNull()
    .references(() => entries.id, { onDelete: 'cascade' }),
  number: text('number'),
  status: text('status'),
  position: integer('position'),
  laps_completed: integer('laps_completed'),
  total_time: text('total_time'),
  best_lap: text('best_lap'),
  point_gained: doublePrecision('point_gained'),
});

// ----------------------------------------------------
// Drizzle Relations
// ----------------------------------------------------

export const championshipsRelations = relations(championships, ({ many }) => ({
  seasons: many(seasons),
  championshipCategories: many(championshipCategory),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  championshipCategories: many(championshipCategory),
  entries: many(entries),
}));

export const championshipCategoryRelations = relations(championshipCategory, ({ one }) => ({
  championship: one(championships, {
    fields: [championshipCategory.championship_id],
    references: [championships.id],
  }),
  category: one(categories, {
    fields: [championshipCategory.category_id],
    references: [categories.id],
  }),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  championship: one(championships, {
    fields: [seasons.championship_id],
    references: [championships.id],
  }),
  events: many(events),
}));

export const circuitsRelations = relations(circuits, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  season: one(seasons, {
    fields: [events.season_id],
    references: [seasons.id],
  }),
  circuit: one(circuits, {
    fields: [events.circuit_id],
    references: [circuits.id],
  }),
  sessions: many(sessions),
  entries: many(entries),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  event: one(events, {
    fields: [sessions.event_id],
    references: [events.id],
  }),
  sessionResults: many(sessionResults),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  cars: many(cars),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
  brand: one(brands, {
    fields: [cars.brand_id],
    references: [brands.id],
  }),
  entries: many(entries),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  entries: many(entries),
}));

export const pilotsRelations = relations(pilots, ({ many }) => ({
  entryPilots: many(entryPilot),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
  event: one(events, {
    fields: [entries.event_id],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [entries.team_id],
    references: [teams.id],
  }),
  car: one(cars, {
    fields: [entries.car_id],
    references: [cars.id],
  }),
  category: one(categories, {
    fields: [entries.category_id],
    references: [categories.id],
  }),
  entryPilots: many(entryPilot),
  sessionResults: many(sessionResults),
}));

export const entryPilotRelations = relations(entryPilot, ({ one }) => ({
  entry: one(entries, {
    fields: [entryPilot.entry_id],
    references: [entries.id],
  }),
  pilot: one(pilots, {
    fields: [entryPilot.pilot_id],
    references: [pilots.id],
  }),
}));

export const sessionResultsRelations = relations(sessionResults, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionResults.session_id],
    references: [sessions.id],
  }),
  entry: one(entries, {
    fields: [sessionResults.entry_id],
    references: [entries.id],
  }),
}));
