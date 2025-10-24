import api from './apiClient';import api from './apiClient';

import type { Theater } from '../types/Theater';

export interface Theater {

class TheaterService {  id: number;

  private readonly BASE_URL = '/theaters';  cinemaId: number;

  name: string;

  async getTheatersByCinema(cinemaId: number): Promise<Theater[]> {  rows: number;

    try {  columns: number;

      const response = await api.get(`/cinemas/${cinemaId}/theaters`);  capacity: number;

      return response.data;  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';

    } catch (error) {}

      console.error('Error fetching theaters:', error);

      return [];export interface ShowroomStatus {

    }  occupiedPercentage: number;

  }  temporaryReservedSeats: number[];

  permanentReservedSeats: number[];

  async getTheater(theaterId: number): Promise<Theater | null> {  availableSeats: number[];

    try {}

      const response = await api.get(`${this.BASE_URL}/${theaterId}`);

      return response.data;class TheaterService {

    } catch (error) {  async getTheater(theaterId: number): Promise<Theater> {

      console.error('Error fetching theater:', error);    const response = await api.get(`/theaters/${theaterId}`);

      return null;    return response.data;

    }  }

  }

}  async getShowroomStatus(showtimeId: number): Promise<ShowroomStatus> {

    const response = await api.get(`/showtimes/${showtimeId}/status`);

export const theaterService = new TheaterService();    return response.data;

export default theaterService;  }

  async getShowroomMatrix(theaterId: number): Promise<number[][]> {
    const response = await api.get(`/theaters/${theaterId}/matrix`);
    return response.data;
  }
}

export const theaterService = new TheaterService();
export default theaterService;