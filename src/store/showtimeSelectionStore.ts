import { create } from 'zustand';

// Interface aligned with backend flow document (FLUJO_COMPLETO_VENTA.md)
export interface MovieSelection {
  showtimeId: number; // ID real del backend
  movieId: number;
  movieTitle: string;
  cinemaId: number;
  cinemaName: string;
  theaterName: string; // Puede venir luego del backend; placeholder si no existe aún
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (local)
  format: string; // Ej: "IMAX_3D", "2D"
  price?: number; // Precio por entrada si disponible
}

interface ShowtimeSelectionState {
  selection: MovieSelection | null;
  setSelection: (sel: MovieSelection) => void;
  clear: () => void;
  hydrateFromStorage: () => void;
}

const STORAGE_KEY = 'movieSelection';

export const useShowtimeSelectionStore = create<ShowtimeSelectionState>((set) => ({
  selection: null,
  setSelection: (sel) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
    } catch { /* ignore quota errors */ }
    set({ selection: sel });
  },
  clear: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    set({ selection: null });
  },
  hydrateFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MovieSelection;
        set({ selection: parsed });
      }
    } catch {
      set({ selection: null });
    }
  }
}));

// Auto-hidratación temprana (opcional; se puede llamar manualmente en layouts)
// Evitar ejecutar en entorno SSR si se agrega luego.
try {
  useShowtimeSelectionStore.getState().hydrateFromStorage();
} catch { /* noop */ }
