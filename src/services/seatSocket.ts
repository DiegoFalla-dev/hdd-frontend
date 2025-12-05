export interface SeatOccupancyEvent {
  type: 'SEAT_UPDATE';
  showtimeId: number;
  occupiedCodes: string[];
}

type Listener = (event: SeatOccupancyEvent) => void;

class SeatSocket {
  private ws?: WebSocket;
  private listeners: Set<Listener> = new Set();
  private showtimeId?: number;

  connect(showtimeId: number) {
    if (this.ws && this.showtimeId === showtimeId) return;
    this.disconnect();
    this.showtimeId = showtimeId;
    const base = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws';
    try {
      this.ws = new WebSocket(`${base}?showtimeId=${showtimeId}`);
      this.ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data && data.type === 'SEAT_UPDATE') {
            this.emit({ type: 'SEAT_UPDATE', showtimeId, occupiedCodes: data.occupiedCodes || [] });
          }
        } catch { /* ignore malformed */ }
      };
      this.ws.onclose = () => { /* silent */ };
      this.ws.onerror = () => { /* silent */ };
    } catch {
      // Si falla conexión, simular actualizaciones periódicas básicas
      setInterval(() => {
        if (!this.showtimeId) return;
        this.emit({ type: 'SEAT_UPDATE', showtimeId: this.showtimeId, occupiedCodes: [] });
      }, 30000);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.ws = undefined;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SeatOccupancyEvent) {
    this.listeners.forEach(l => l(event));
  }
}

export const seatSocket = new SeatSocket();

export function initSeatSocket(showtimeId: number, onUpdate: (occupiedCodes: string[]) => void) {
  seatSocket.connect(showtimeId);
  const unsub = seatSocket.subscribe(ev => {
    if (ev.type === 'SEAT_UPDATE' && ev.showtimeId === showtimeId) {
      onUpdate(ev.occupiedCodes);
    }
  });
  return () => {
    unsub();
  };
}