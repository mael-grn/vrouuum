import { apiClient } from '@/lib/api-client';
import type { Championship, Category, Season } from '@/types';

export const competitionsApi = {
  // Championships
  getChampionships: () => apiClient.get<Championship[]>('/competitions/championships'),
  createChampionship: (data: { name: string; logo?: string }) =>
    apiClient.post<Championship>('/competitions/championships', data),
  updateChampionship: (id: number, data: Partial<{ name: string; logo: string }>) =>
    apiClient.patch<Championship>(`/competitions/championships/${id}`, data),
  deleteChampionship: (id: number) =>
    apiClient.delete<{ message: string }>(`/competitions/championships/${id}`),

  // Categories
  getCategories: () => apiClient.get<Category[]>('/competitions/categories'),
  createCategory: (data: { name: string; logo?: string }) =>
    apiClient.post<Category>('/competitions/categories', data),
  updateCategory: (id: number, data: Partial<{ name: string; logo: string }>) =>
    apiClient.patch<Category>(`/competitions/categories/${id}`, data),
  deleteCategory: (id: number) =>
    apiClient.delete<{ message: string }>(`/competitions/categories/${id}`),

  // Link Championship <-> Category
  linkCategory: (championshipId: number, categoryId: number) =>
    apiClient.post(`/competitions/championships/${championshipId}/categories`, {
      category_id: categoryId,
    }),
  unlinkCategory: (championshipId: number, categoryId: number) =>
    apiClient.delete(`/competitions/championships/${championshipId}/categories/${categoryId}`),

  // Seasons
  getSeasons: (championshipId: number) =>
    apiClient.get<Season[]>(`/competitions/championships/${championshipId}/seasons`),
  createSeason: (championshipId: number, data: { name: string }) =>
    apiClient.post<Season>(`/competitions/championships/${championshipId}/seasons`, data),
  updateSeason: (id: number, data: { name: string }) =>
    apiClient.patch<Season>(`/competitions/seasons/${id}`, data),
  deleteSeason: (id: number) =>
    apiClient.delete<{ message: string }>(`/competitions/seasons/${id}`),
};
