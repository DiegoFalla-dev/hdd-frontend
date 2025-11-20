import apiClient from './apiClient';

// Interfaz para la respuesta del backend (MovieDto)
interface MovieDTO {
    id: number;
    title: string;
    synopsis: string;
    genre: string;
    classification: string;
    duration: string;
    cardImageUrl: string;
    bannerUrl: string;
    trailerUrl: string;
    cast: string[];
    showtimes: string[];
    status: 'CARTELERA' | 'PREVENTA' | 'PROXIMO';
}

// Interfaz para el formato usado en el frontend
export interface Pelicula {
    id: string;
    titulo: string;
    sinopsis?: string;
    genero?: string;
    clasificacion?: string;
    duracion?: string;
    imagenCard?: string;
    banner?: string;
    trailerUrl?: string;
    reparto?: string[];
    horarios?: string[];
    status?: 'CARTELERA' | 'PREVENTA' | 'PROXIMO';
}

// Datos de respaldo que coinciden con la estructura
const FALLBACK_MOVIES: Pelicula[] = [
    {
        id: '1',
        titulo: 'Andrea Bocelli',
        imagenCard: '/placeholder1.jpg',
        genero: 'Documental',
        status: 'CARTELERA',
        clasificacion: 'Todo público',
        duracion: '2h 10m'
    },
    {
        id: '2',
        titulo: 'Camina o Muere',
        imagenCard: '/placeholder2.jpg',
        genero: 'Acción',
        status: 'PREVENTA',
        clasificacion: 'PG-13',
        duracion: '1h 45m'
    },
    {
        id: '3',
        titulo: 'El Apóstol de los Andes',
        imagenCard: '/placeholder3.jpg',
        genero: 'Drama',
        status: 'PROXIMO',
        clasificacion: 'PG',
        duracion: '2h 05m'
    }
];

// Función para transformar la respuesta del backend al formato frontend
function transformMovieData(backendMovie: MovieDTO): Pelicula {
    return {
        id: String(backendMovie.id),
        titulo: backendMovie.title,
        sinopsis: backendMovie.synopsis,
        genero: backendMovie.genre,
        clasificacion: backendMovie.classification,
        duracion: backendMovie.duration,
        imagenCard: backendMovie.cardImageUrl,
        banner: backendMovie.bannerUrl,
        trailerUrl: backendMovie.trailerUrl,
        reparto: backendMovie.cast,
        horarios: backendMovie.showtimes,
        status: backendMovie.status
    };
}

export async function getMovies(): Promise<Pelicula[]> {
    try {
        const response = await apiClient.get<MovieDTO[]>('/api/movies');
        
        if (Array.isArray(response.data)) {
            return response.data.map(transformMovieData);
        }
        
        console.warn('Unexpected API response format, using fallback data');
        return FALLBACK_MOVIES;
    } catch (err: unknown) {
        const maybe = err as { response?: { status?: number; statusText?: string }; config?: { url?: string } } | undefined;
        if (maybe && maybe.response) {
            console.error('API Error:', {
                status: maybe.response.status,
                statusText: maybe.response.statusText,
                url: maybe.config?.url
            });
        } else {
            console.error('Unknown error fetching movies:', err);
        }
        return FALLBACK_MOVIES;
    }
}

export default { getMovies };
