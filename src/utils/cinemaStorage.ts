import type { Cinema } from '../types/Cinema';

const CINEMA_KEY = 'selectedCine';

export const cinemaStorage = {
  save: (cinema: Cinema): void => {
    localStorage.setItem(CINEMA_KEY, JSON.stringify(cinema));
  },

  load: (): Cinema | null => {
    try {
      const saved = localStorage.getItem(CINEMA_KEY);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      
      // Validar que tiene las propiedades mínimas de Cinema
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.name) {
        return parsed as Cinema;
      }
      
      return null;
    } catch {
      // Limpiar localStorage si hay datos corruptos
      localStorage.removeItem(CINEMA_KEY);
      return null;
    }
  },

  clear: (): void => {
    localStorage.removeItem(CINEMA_KEY);
  }
};