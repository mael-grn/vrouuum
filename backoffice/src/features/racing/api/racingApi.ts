import { apiClient } from '@/lib/api-client';
import type { Entry, SessionResult } from '@/types';

export const racingApi = {
  // Entries
  getEntries: (eventId: number) => apiClient.get<Entry[]>(`/racing/events/${eventId}/entries`),
  createEntry: (
    eventId: number,
    data: {
      team_id: number;
      car_id: number;
      category_id: number;
      number: string;
    }
  ) => apiClient.post<Entry>(`/racing/events/${eventId}/entries`, data),
  updateEntry: (
    id: number,
    data: Partial<{
      team_id: number;
      car_id: number;
      category_id: number;
      number: string;
    }>
  ) => apiClient.patch<Entry>(`/racing/entries/${id}`, data),
  deleteEntry: (id: number) => apiClient.delete<{ message: string }>(`/racing/entries/${id}`),

  // Entry Pilots
  addPilotToEntry: (entryId: number, pilotId: number) =>
    apiClient.post(`/racing/entries/${entryId}/pilots`, { pilot_id: pilotId }),
  removePilotFromEntry: (entryId: number, pilotId: number) =>
    apiClient.delete(`/racing/entries/${entryId}/pilots/${pilotId}`),

  // Session Results
  getSessionResults: (sessionId: number) =>
    apiClient.get<SessionResult[]>(`/racing/sessions/${sessionId}/results`),
  createSessionResult: (
    sessionId: number,
    data: {
      entry_id: number;
      number: string;
      status: string;
      position: number;
      laps_completed: number;
      total_time?: string;
      best_lap?: string;
      point_gained: number;
    }
  ) => apiClient.post<SessionResult>(`/racing/sessions/${sessionId}/results`, data),
  batchCreateSessionResults: (
    sessionId: number,
    results: Array<{
      entry_id: number;
      number: string;
      status: string;
      position: number;
      laps_completed: number;
      total_time?: string;
      best_lap?: string;
      point_gained: number;
    }>
  ) =>
    apiClient.post<SessionResult[]>(`/racing/sessions/${sessionId}/results/batch`, { results }),
  updateSessionResult: (
    id: number,
    data: Partial<{
      number: string;
      status: string;
      position: number;
      laps_completed: number;
      total_time: string;
      best_lap: string;
      point_gained: number;
    }>
  ) => apiClient.patch<SessionResult>(`/racing/results/${id}`, data),
  deleteSessionResult: (id: number) =>
    apiClient.delete<{ message: string }>(`/racing/results/${id}`),
};
