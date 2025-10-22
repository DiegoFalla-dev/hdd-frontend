export interface ApiMovie {
  id: string;
  titulo?: string;
  descripcion?: string;
  imagenCard?: string;
  // other fields as returned by backend
}

export async function fetchMovies(): Promise<ApiMovie[]> {
  try {
    const res = await fetch('/api/movies');
    if (!res.ok) return [];
    const data = await res.json();
    return data as ApiMovie[];
  } catch {
    return [];
  }
}
