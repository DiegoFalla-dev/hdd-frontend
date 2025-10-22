export interface CinemaApi {
  id: number | string;
  name: string;
}

export async function fetchCinemas(): Promise<CinemaApi[]> {
  try {
    const res = await fetch('/api/cinemas');
    if (!res.ok) return [];
    const data = await res.json();
    return data as CinemaApi[];
  } catch {
    return [];
  }
}
