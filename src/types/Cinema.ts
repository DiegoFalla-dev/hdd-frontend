// types/Cinema.ts
export interface CinemaShowtime {
  time: string; // "14:30"
  format: string; // "2D", "3D", "IMAX"
  language: string; // "Doblada", "Subtitulada"
  seatAvailability: 'Alta' | 'Media' | 'Baja' | 'Lleno'; // Para la visualización
}

export interface Cinema {
  id: number;
  city?: string;
  name: string;
  location: string;
  address: string; // Asegúrate de tener esta propiedad para la dirección
  image?: string;
  availableFormats?: string[];
  // ... otras propiedades que ya tengas

  // Esta es la nueva propiedad para los horarios por película y fecha
  availableShowtimes?: {
    movieId: string; // El ID de la película
    date: string;    // La fecha en formato "YYYY-MM-DD"
    times: CinemaShowtime[]; // Un array de objetos Showtime para esa película y fecha
  }[];
}