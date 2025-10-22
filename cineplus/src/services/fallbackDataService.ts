import { peliculas } from "../data/peliculas";
import { getProductosByCine } from "../data/cinesDulceria";
import { cines as localCines } from "../data/cines";
import { getMovieShowtimes } from "../data/cinemasSchedule";
import type { Pelicula } from "../data/peliculas";
import type { ProductoDulceria } from "../data/dulceria";
import type { Showtime as CSShowtime } from "../data/cinemasSchedule";

// A small fallback service that returns local data. Later can be extended to try network first.
export async function getMovies(): Promise<Pelicula[]> {
  // Immediately return local peliculas
  return peliculas;
}

export async function getConcessionsByCinema(cinemaName: string | null): Promise<{ combos: ProductoDulceria[]; canchita: ProductoDulceria[]; bebidas: ProductoDulceria[]; snacks: ProductoDulceria[] } | null> {
  if (!cinemaName) return null;
  return getProductosByCine(cinemaName);
}

export async function getCinemas(): Promise<typeof localCines> {
  return localCines;
}

export async function getShowtimes(movieId: string, cinemaName?: string | undefined): Promise<CSShowtime[]> {
  if (!movieId || !cinemaName) return [];
  return getMovieShowtimes(cinemaName, movieId);
}
