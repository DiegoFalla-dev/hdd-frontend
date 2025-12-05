import api from './apiClient';
import type { Theater } from '../types/Theater';

export async function getTheatersByCinema(cinemaId: number): Promise<Theater[]> {
  const resp = await api.get(`/theaters`, { params: { cinemaId } });
  return Array.isArray(resp.data) ? resp.data : [];
}

export async function createTheater(cinemaId: number, payload: Partial<Theater>): Promise<Theater> {
  // Backend expects TheaterDto: { cinemaId, name, seatMatrixType, rowCount, colCount, totalSeats }
  const dto = {
    cinemaId,
    name: payload.name,
    seatMatrixType: mapSeatType(payload.type),
    rowCount: payload.rows,
    colCount: payload.columns,
    totalSeats: payload.capacity,
  };
  const resp = await api.post(`/theaters`, dto);
  return resp.data as Theater;
}

export async function updateTheater(id: number, payload: Partial<Theater>): Promise<Theater> {
  const dto = {
    name: payload.name,
    seatMatrixType: mapSeatType(payload.type),
    rowCount: payload.rows,
    colCount: payload.columns,
    totalSeats: payload.capacity,
  };
  const resp = await api.put(`/theaters/${id}`, dto);
  return resp.data as Theater;
}

export async function deleteTheater(id: number): Promise<void> {
  await api.delete(`/theaters/${id}`);
}

function mapSeatType(type?: Theater['type']): string | undefined {
  if (!type) return undefined;
  if (type === 'XL') return 'XLARGE';
  return type;
}

export default { getTheatersByCinema, createTheater, updateTheater, deleteTheater };
