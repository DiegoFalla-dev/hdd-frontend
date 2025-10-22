// Adapter helpers to map possible API shapes to local data shapes.
import type { Pelicula } from "../data/peliculas";
import type { ProductoDulceria } from "../data/dulceria";
import type { Showtime as CSShowtime } from "../data/cinemasSchedule";

export function mapApiMovieToPelicula(api: unknown): Pelicula {
  const f = api as Record<string, unknown>;
  return {
    id: String(f['id'] ?? ''),
    titulo: String(f['titulo'] || f['title'] || f['name'] || ''),
    sinopsis: String(f['descripcion'] || f['description'] || f['synopsis'] || ''),
    genero: String(f['genero'] || f['genre'] || 'N/A'),
    clasificacion: String(f['clasificacion'] || f['classification'] || ''),
    duracion: String(f['duracion'] || f['duration'] || ''),
    banner: String(f['banner'] || f['image'] || ''),
    imagenCard: String(f['imagenCard'] || f['poster'] || f['image'] || ''),
    trailerUrl: String(f['trailerUrl'] || f['trailer'] || ''),
    reparto: Array.isArray(f['reparto']) ? (f['reparto'] as string[]) : (Array.isArray(f['cast']) ? (f['cast'] as string[]) : []),
    horarios: Array.isArray(f['horarios']) ? (f['horarios'] as string[]) : [],
  };
}

export function mapApiProductToProducto(api: unknown): ProductoDulceria {
  const f = api as Record<string, unknown>;
  return {
    id: String(f['id'] ?? ''),
    nombre: String(f['nombre'] || f['name'] || ''),
    descripcion: String(f['descripcion'] || f['description'] || ''),
    precio: Number(f['precio'] ?? 0),
    imagen: f['imagen'] ? String(f['imagen']) : undefined,
    categoria: (f['categoria'] || f['category'] || 'snacks') as ProductoDulceria['categoria'],
  };
}

export function mapApiShowtimesToCSShowtimes(api: unknown): CSShowtime[] {
  if (!Array.isArray(api)) return [];
  return (api as unknown[]).map(item => {
    const f = item as Record<string, unknown>;
    return {
      id: String(f['id'] ?? f['showtimeId'] ?? ''),
      date: String(f['date'] ?? f['day'] ?? ''),
      time: String(f['time'] ?? f['hora'] ?? ''),
      format: (f['format'] || f['formato'] || '2D') as CSShowtime['format'],
      seatMatrix: (f['seatMatrix'] || f['matrix'] || 'medium') as CSShowtime['seatMatrix'],
      availableSeats: Number(f['availableSeats'] ?? f['available'] ?? 0),
      totalSeats: Number(f['totalSeats'] ?? f['total'] ?? 0),
    };
  });
}
