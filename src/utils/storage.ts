// util para manejo seguro de localStorage
import type { Cinema } from '../types/Cinema';

const SAFE_PREFIX = 'cineplus:';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('storage: parse error', e);
    return null;
  }
}

export function setSelectedCine(cine: Cinema) {
  try {
    localStorage.setItem('selectedCine', JSON.stringify(cine));
  } catch (e) {
    console.error('setSelectedCine failed', e);
  }
}

export function getSelectedCine(): Cinema | null {
  return safeParse<Cinema>(localStorage.getItem('selectedCine'));
}

export function clearSelectedCine() {
  localStorage.removeItem('selectedCine');
}

export interface MovieSelection {
  pelicula: any;
  selectedDay?: string | null;
  selectedTime?: string | null;
  selectedFormat?: string | null;
  selectedCineId?: number | null;
  showtimeId?: number | null;
  theater?: {
    id: number;
    number: string;
  } | null;
}

export function setMovieSelection(sel: MovieSelection) {
  try {
    localStorage.setItem('movieSelection', JSON.stringify(sel));
  } catch (e) {
    console.error('setMovieSelection failed', e);
  }
}

export function getMovieSelection(): MovieSelection | null {
  return safeParse<MovieSelection>(localStorage.getItem('movieSelection'));
}

export function clearMovieSelection() {
  localStorage.removeItem('movieSelection');
}

export default {
  safeParse,
  setSelectedCine,
  getSelectedCine,
  clearSelectedCine,
  setMovieSelection,
  getMovieSelection,
  clearMovieSelection,
};
