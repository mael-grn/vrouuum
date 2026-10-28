import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

// Connection pool for queries
export const client = postgres(env.DATABASE_URL, {
  prepare: false, // Recommended for Neon pooling / serverless
  max: 10,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
