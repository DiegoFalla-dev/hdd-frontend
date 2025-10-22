export interface Showtime {
  movieId: string;
  cinemaId: string;
  date: string; // ISO
  times: string[];
}

export async function fetchShowtimes(movieId: string, cinemaId?: string): Promise<Showtime[]> {
  try {
    const url = cinemaId ? `/api/showtimes?movie=${encodeURIComponent(movieId)}&cinema=${encodeURIComponent(cinemaId)}` : `/api/showtimes?movie=${encodeURIComponent(movieId)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data as Showtime[];
  } catch {
    return [];
  }
}
