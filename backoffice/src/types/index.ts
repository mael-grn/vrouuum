// Database models strictly aligned with DATABASE.md

export interface Championship {
  id: number;
  name: string;
  logo: string | null;
}

export interface Category {
  id: number;
  name: string;
  logo: string | null;
}

export interface ChampionshipCategory {
  id: number;
  championship_id: number;
  category_id: number;
}

export interface Season {
  id: number;
  championship_id: number;
  name: string;
}

export interface Circuit {
  id: number;
  name: string;
  country: string;
  length: number; // in km or m
  type: string; // e.g. 'permanent', 'street', 'mixed'
}

export interface Event {
  id: number;
  season_id: number;
  circuit_id: number;
  name: string;
  date: string;
}

export interface Session {
  id: number;
  event_id: number;
  name: string;
  type: string; // 'practice' | 'qualifying' | 'race'
  date: string;
}

export interface Brand {
  id: number;
  name: string;
  logo: string | null;
  country: string;
}

export interface Car {
  id: number;
  brand_id: number;
  name: string;
  power: number; // horsepower
  weight: number; // kg
  year: number;
}

export interface Team {
  id: number;
  name: string;
  logo: string | null;
  country: string;
  entries?: Entry[];
}

export interface Pilot {
  id: number;
  name: string;
  surname: string;
  country: string;
  photo?: string | null;
  entryPilots?: Array<{
    id: number;
    entry_id: number;
    pilot_id: number;
  }>;
}

export interface Entry {
  id: number;
  event_id: number;
  team_id: number;
  car_id: number;
  category_id: number;
  number: string;
}

export interface EntryPilot {
  id: number;
  entry_id: number;
  pilot_id: number;
}

export interface SessionResult {
  id: number;
  session_id: number;
  entry_id: number;
  number: string;
  status: 'Finished' | 'DNF' | 'DSQ' | 'DNS' | string;
  position: number;
  laps_completed: number;
  total_time: string | null;
  best_lap: string | null;
  point_gained: number;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
