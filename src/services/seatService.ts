import api from './apiClient';
import type { Seat } from '../types/Seat';

class SeatService {
  async getTheaterLayout(theaterId: number): Promise<{rows: number; columns: number}> {
    try {
      const response = await api.get(`/theaters/${theaterId}/layout`);
      return response.data;
    } catch (error) {
      console.error('Error fetching theater layout:', error);
      return { rows: 0, columns: 0 };
    }
  }

  async getSeatsByShowtime(showtimeId: number): Promise<{layout: {rows: number; columns: number}, seats: Seat[]}> {
    try {
      const response = await api.get(`/showtimes/${showtimeId}/seats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching seats:', error);
      return { layout: { rows: 0, columns: 0 }, seats: [] };
    }
  }

  async validateSeats(showtimeId: number, seatIds: number[]): Promise<boolean> {
    try {
      const response = await api.post(`/showtimes/${showtimeId}/validate-seats`, {
        seats: seatIds
      });
      return response.data.valid;
    } catch (error) {
      console.error('Error validating seats:', error);
      return false;
    }
  }

  async reserveSeats(showtimeId: number, seatIds: number[]): Promise<boolean> {
    try {
      await api.post(`/showtimes/${showtimeId}/reserve-seats`, {
        seats: seatIds
      });
      return true;
    } catch (error) {
      console.error('Error reserving seats:', error);
      return false;
    }
  }

  async releaseSeats(showtimeId: number, seatIds: number[]): Promise<boolean> {
    try {
      await api.post(`/showtimes/${showtimeId}/release-seats`, {
        seats: seatIds
      });
      return true;
    } catch (error) {
      console.error('Error releasing seats:', error);
      return false;
    }
  }
}

export const seatService = new SeatService();
export default seatService;
