import { apiClient } from '@/lib/api-client';
import type { Circuit, Event, Session } from '@/types';

export const calendarApi = {
  // Circuits
  getCircuits: () => apiClient.get<Circuit[]>('/circuits'),
  createCircuit: (data: { name: string; country: string; length: number; type: string }) =>
    apiClient.post<Circuit>('/circuits', data),
  updateCircuit: (id: number, data: Partial<{ name: string; country: string; length: number; type: string }>) =>
    apiClient.patch<Circuit>(`/circuits/${id}`, data),
  deleteCircuit: (id: number) => apiClient.delete<{ message: string }>(`/circuits/${id}`),

  // Events
  getEvents: (seasonId?: number) =>
    apiClient.get<Event[]>(seasonId ? `/events?season_id=${seasonId}` : '/events'),
  createEvent: (data: { season_id: number; circuit_id: number; name: string; date: string }) =>
    apiClient.post<Event>('/events', data),
  updateEvent: (
    id: number,
    data: Partial<{ season_id: number; circuit_id: number; name: string; date: string }>
  ) => apiClient.patch<Event>(`/events/${id}`, data),
  deleteEvent: (id: number) => apiClient.delete<{ message: string }>(`/events/${id}`),

  // Sessions
  getSessions: (eventId: number) => apiClient.get<Session[]>(`/events/${eventId}/sessions`),
  createSession: (eventId: number, data: { name: string; type: string; date: string }) =>
    apiClient.post<Session>(`/events/${eventId}/sessions`, data),
  updateSession: (
    id: number,
    data: Partial<{ name: string; type: string; date: string }>
  ) => apiClient.patch<Session>(`/sessions/${id}`, data),
  deleteSession: (id: number) => apiClient.delete<{ message: string }>(`/sessions/${id}`),
};
