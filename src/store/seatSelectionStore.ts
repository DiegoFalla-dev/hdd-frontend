import { create } from 'zustand';

interface ShowtimeSelection {
  seatCodes: string[]; // selección local pendiente o confirmada
  reservedCodes?: string[]; // códigos aceptados por backend en reserva temporal
  failedCodes?: string[]; // últimos códigos que fallaron en reserva
  expiresAt?: number; // epoch ms límite de la reserva temporal
  sessionId?: string; // identificador de sesión devuelto por backend para asociar pago
}

interface SeatSelectionState {
  currentShowtimeId?: number;
  selections: Record<number, ShowtimeSelection>; // keyed by showtimeId
  setCurrentShowtime: (showtimeId: number) => void;
  toggleSeatCode: (showtimeId: number, seatCode: string, max: number) => void;
  applyReservationResult: (showtimeId: number, failed: string[]) => void;
  attachSession: (showtimeId: number, sessionId: string, expiresInMs?: number) => void;
  clearShowtime: (showtimeId: number) => void;
  clearAll: () => void;
  loadFromStorage: (showtimeId: number) => void;
  purgeExpired: () => void;
}

const STORAGE_KEY = 'seatSelections';
const RESERVATION_WINDOW_MS = 60 * 1000; // 1 min (requerimiento fase actual)

function readStorage(): Record<number, ShowtimeSelection> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage(data: Record<number, ShowtimeSelection>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export const useSeatSelectionStore = create<SeatSelectionState>((set, get) => ({
  currentShowtimeId: undefined,
  selections: readStorage(),
  setCurrentShowtime: (showtimeId) => {
    const { selections } = get();
    // load existing or create fresh with expiration
    if (!selections[showtimeId]) {
      selections[showtimeId] = { seatCodes: [], reservedCodes: [], failedCodes: [], expiresAt: Date.now() + RESERVATION_WINDOW_MS };
      writeStorage(selections);
    }
    set({ currentShowtimeId: showtimeId, selections: { ...selections } });
  },
  toggleSeatCode: (showtimeId, seatCode, max) => {
    const { selections } = get();
    const sel = selections[showtimeId] || { seatCodes: [], reservedCodes: [], failedCodes: [], expiresAt: Date.now() + RESERVATION_WINDOW_MS };
    const exists = sel.seatCodes.includes(seatCode);
    let nextCodes: string[];
    if (exists) {
      nextCodes = sel.seatCodes.filter(c => c !== seatCode);
    } else if (sel.seatCodes.length < max) {
      nextCodes = [...sel.seatCodes, seatCode];
    } else {
      nextCodes = sel.seatCodes; // ignore if max reached
    }
    selections[showtimeId] = { ...sel, seatCodes: nextCodes };
    writeStorage(selections);
    set({ selections: { ...selections } });
  },
  applyReservationResult: (showtimeId, failed) => {
    const { selections } = get();
    const sel = selections[showtimeId];
    if (!sel) return;
    const failedSet = new Set(failed);
    const accepted = sel.seatCodes.filter(c => !failedSet.has(c));
    selections[showtimeId] = { ...sel, reservedCodes: accepted, failedCodes: failed };
    writeStorage(selections);
    set({ selections: { ...selections } });
  },
  attachSession: (showtimeId, sessionId, expiresInMs) => {
    const { selections } = get();
    const sel = selections[showtimeId];
    if (!sel) return;
    selections[showtimeId] = {
      ...sel,
      sessionId,
      // si backend provee nuevo tiempo de expiración, sobrescribir
      expiresAt: expiresInMs ? Date.now() + expiresInMs : sel.expiresAt
    };
    writeStorage(selections);
    set({ selections: { ...selections } });
  },
  clearShowtime: (showtimeId) => {
    const { selections } = get();
    delete selections[showtimeId];
    writeStorage(selections);
    set({ selections: { ...selections } });
  },
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ selections: {}, currentShowtimeId: undefined });
  },
  loadFromStorage: (showtimeId) => {
    const data = readStorage();
    set({ selections: data, currentShowtimeId: showtimeId });
  },
  purgeExpired: () => {
    const { selections } = get();
    const now = Date.now();
    let changed = false;
    Object.entries(selections).forEach(([id, sel]) => {
      if (sel.expiresAt && sel.expiresAt < now) {
        delete selections[Number(id)];
        changed = true;
      }
    });
    if (changed) {
      writeStorage(selections);
      set({ selections: { ...selections } });
    }
  },
}));
