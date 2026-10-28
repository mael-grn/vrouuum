import { apiClient } from '@/lib/api-client';
import type { Brand, Car, Team, Pilot } from '@/types';

export const paddockApi = {
  // Brands
  getBrands: () => apiClient.get<Brand[]>('/paddock/brands'),
  createBrand: (data: { name: string; logo?: string; country: string }) =>
    apiClient.post<Brand>('/paddock/brands', data),
  updateBrand: (id: number, data: Partial<{ name: string; logo: string | null; country: string }>) =>
    apiClient.put<Brand>(`/paddock/brands/${id}`, data),
  deleteBrand: (id: number) => apiClient.delete<{ message: string }>(`/paddock/brands/${id}`),

  // Cars
  getCars: (brandId?: number) =>
    apiClient.get<Car[]>(brandId ? `/paddock/cars?brand_id=${brandId}` : '/paddock/cars'),
  createCar: (data: { brand_id: number; name: string; power: number; weight: number; year: number }) =>
    apiClient.post<Car>('/paddock/cars', data),
  updateCar: (
    id: number,
    data: Partial<{ brand_id: number; name: string; power: number; weight: number; year: number }>
  ) => apiClient.put<Car>(`/paddock/cars/${id}`, data),
  deleteCar: (id: number) => apiClient.delete<{ message: string }>(`/paddock/cars/${id}`),

  // Teams
  getTeams: () => apiClient.get<Team[]>('/paddock/teams'),
  createTeam: (data: { name: string; logo?: string; country: string }) =>
    apiClient.post<Team>('/paddock/teams', data),
  updateTeam: (id: number, data: Partial<{ name: string; logo: string | null; country: string }>) =>
    apiClient.put<Team>(`/paddock/teams/${id}`, data),
  deleteTeam: (id: number) => apiClient.delete<{ message: string }>(`/paddock/teams/${id}`),

  // Pilots
  getPilots: (country?: string) =>
    apiClient.get<Pilot[]>(country ? `/paddock/pilots?country=${country}` : '/paddock/pilots'),
  createPilot: (data: { name: string; surname: string; country: string; photo?: string | null }) =>
    apiClient.post<Pilot>('/paddock/pilots', data),
  updatePilot: (
    id: number,
    data: Partial<{ name: string; surname: string; country: string; photo: string | null }>
  ) => apiClient.put<Pilot>(`/paddock/pilots/${id}`, data),
  deletePilot: (id: number) => apiClient.delete<{ message: string }>(`/paddock/pilots/${id}`),
};
