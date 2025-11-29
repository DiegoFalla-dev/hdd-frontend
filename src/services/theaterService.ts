import api from './apiClient';
import type { Theater } from '../types/Theater';

export async function getTheatersByCinema(cinemaId: number): Promise<Theater[]> {
  const resp = await api.get(`/cinemas/${cinemaId}/theaters`);
  return Array.isArray(resp.data) ? resp.data : [];
}

export async function createTheater(cinemaId: number, payload: Partial<Theater>): Promise<Theater> {
  const resp = await api.post(`/cinemas/${cinemaId}/theaters`, payload);
  return resp.data as Theater;
}

export async function updateTheater(id: number, payload: Partial<Theater>): Promise<Theater> {
  const resp = await api.put(`/theaters/${id}`, payload);
  return resp.data as Theater;
}

export async function deleteTheater(id: number): Promise<void> {
  await api.delete(`/theaters/${id}`);
}

export default { getTheatersByCinema, createTheater, updateTheater, deleteTheater };
