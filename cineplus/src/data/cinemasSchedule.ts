// Cinema scheduling system with seat matrices and showtimes

export interface Showtime {
  id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  format: '2D' | '3D' | 'XD';
  seatMatrix: 'small' | 'medium' | 'large' | 'xlarge'; // 13x17, 15x17, 16x22, 17x20
  availableSeats: number;
  totalSeats: number;
}

export interface CinemaMovie {
  movieId: string;
  showtimes: Showtime[];
}

export interface Cinema {
  id: string;
  name: string;
  movies: CinemaMovie[];
}

// Seat matrix configurations
export const SEAT_MATRICES = {
  small: { rows: 13, cols: 17 }, // 221 seats
  medium: { rows: 15, cols: 17 }, // 255 seats
  large: { rows: 16, cols: 22 }, // 352 seats
  xlarge: { rows: 17, cols: 20 } // 340 seats
};

// Generate showtimes based on movie type
const generateShowtimes = (movieId: string, isPreSale = false): Showtime[] => {
  const showtimes: Showtime[] = [];
  const today = new Date();
  const formats: ('2D' | '3D' | 'XD')[] = ['2D', '3D', 'XD'];
  const matrices: ('small' | 'medium' | 'large' | 'xlarge')[] = ['small', 'medium', 'large', 'xlarge'];
  const baseTimes = ['10:00', '13:00', '16:00', '19:00', '22:00'];

  // Set date range based on movie type
  const startOffset = isPreSale ? 14 : 0; // Pre-sale starts in 2 weeks
  const dayCount = isPreSale ? 16 : 3; // Pre-sale has 16 days (2 weeks + 2 days), regular has 3 days

  for (let dayOffset = startOffset; dayOffset < startOffset + dayCount; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    baseTimes.forEach((time, timeIndex) => {
      formats.forEach((format, formatIndex) => {
        const matrix = matrices[Math.floor(Math.random() * matrices.length)];
        const totalSeats = SEAT_MATRICES[matrix].rows * SEAT_MATRICES[matrix].cols;
        const availableSeats = Math.floor(totalSeats * (0.3 + Math.random() * 0.7));

        showtimes.push({
          id: `${movieId}-${dateStr}-${time}-${format}`,
          date: dateStr,
          time,
          format,
          seatMatrix: matrix,
          availableSeats,
          totalSeats
        });
      });
    });
  }

  return showtimes;
};

// Cinema data with different movie distributions
export const cinemaSchedules: Cinema[] = [
  // 3 main cinemas with all cartelera movies (1-23) + pre-sale (24-32)
  {
    id: 'asia',
    name: 'Cineplus Asia',
    movies: [
      // Cartelera movies (1-23)
      ...Array.from({length: 23}, (_, i) => ({ 
        movieId: (i + 1).toString(), 
        showtimes: generateShowtimes((i + 1).toString()) 
      })),
      // Pre-sale movies (24-32)
      ...Array.from({length: 9}, (_, i) => ({ 
        movieId: (i + 24).toString(), 
        showtimes: generateShowtimes((i + 24).toString(), true) 
      }))
    ]
  },
  {
    id: 'jockey',
    name: 'Cineplus Jockey Plaza',
    movies: [
      // Cartelera movies (1-23)
      ...Array.from({length: 23}, (_, i) => ({ 
        movieId: (i + 1).toString(), 
        showtimes: generateShowtimes((i + 1).toString()) 
      })),
      // Pre-sale movies (24-32)
      ...Array.from({length: 9}, (_, i) => ({ 
        movieId: (i + 24).toString(), 
        showtimes: generateShowtimes((i + 24).toString(), true) 
      }))
    ]
  },
  {
    id: 'bellavista',
    name: 'Cineplus Mallplaza Bellavista',
    movies: [
      // Cartelera movies (1-23)
      ...Array.from({length: 23}, (_, i) => ({ 
        movieId: (i + 1).toString(), 
        showtimes: generateShowtimes((i + 1).toString()) 
      })),
      // Pre-sale movies (24-32)
      ...Array.from({length: 9}, (_, i) => ({ 
        movieId: (i + 24).toString(), 
        showtimes: generateShowtimes((i + 24).toString(), true) 
      }))
    ]
  },
  // Smaller cinemas with partial movie selections
  {
    id: 'gamarra',
    name: 'Cineplus Gamarra',
    movies: [
      // 15 cartelera movies (1-15)
      ...Array.from({length: 15}, (_, i) => ({ 
        movieId: (i + 1).toString(), 
        showtimes: generateShowtimes((i + 1).toString()) 
      })),
      // 4 pre-sale movies (24-27)
      ...Array.from({length: 4}, (_, i) => ({ 
        movieId: (i + 24).toString(), 
        showtimes: generateShowtimes((i + 24).toString(), true) 
      }))
    ]
  },
  {
    id: 'lambramani',
    name: 'Cineplus Lambramani',
    movies: [
      // 17 cartelera movies (1-17)
      ...Array.from({length: 17}, (_, i) => ({ 
        movieId: (i + 1).toString(), 
        showtimes: generateShowtimes((i + 1).toString()) 
      })),
      // 5 pre-sale movies (24-28)
      ...Array.from({length: 5}, (_, i) => ({ 
        movieId: (i + 24).toString(), 
        showtimes: generateShowtimes((i + 24).toString(), true) 
      }))
    ]
  },
  {
    id: 'arequipa',
    name: 'Cineplus Mall Ave Pza Arequipa',
    movies: [
      // 18 cartelera movies (1-18)
      ...Array.from({length: 18}, (_, i) => ({ 
        movieId: (i + 1).toString(), 
        showtimes: generateShowtimes((i + 1).toString()) 
      })),
      // 6 pre-sale movies (24-29)
      ...Array.from({length: 6}, (_, i) => ({ 
        movieId: (i + 24).toString(), 
        showtimes: generateShowtimes((i + 24).toString(), true) 
      }))
    ]
  },
  {
    id: 'angamos',
    name: 'Cineplus MallPlaza Angamos',
    movies: [
      // 15 cartelera movies (6-20)
      ...Array.from({length: 15}, (_, i) => ({ 
        movieId: (i + 6).toString(), 
        showtimes: generateShowtimes((i + 6).toString()) 
      })),
      // 4 pre-sale movies (28-31)
      ...Array.from({length: 4}, (_, i) => ({ 
        movieId: (i + 28).toString(), 
        showtimes: generateShowtimes((i + 28).toString(), true) 
      }))
    ]
  }
];

// Helper functions
export const getCinemaByName = (cinemaName: string): Cinema | undefined => {
  return cinemaSchedules.find(cinema => cinema.name === cinemaName);
};

export const getMovieShowtimes = (cinemaName: string, movieId: string): Showtime[] => {
  const cinema = getCinemaByName(cinemaName);
  if (!cinema) return [];
  
  const movie = cinema.movies.find(m => m.movieId === movieId);
  return movie ? movie.showtimes : [];
};

export const getAvailableDates = (movieId?: string): { label: string; date: string; fullDate: string }[] => {
  const today = new Date();
  const dates = [];
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  
  // Check if it's a pre-sale movie (24-32)
  const isPreSale = movieId && parseInt(movieId) >= 24 && parseInt(movieId) <= 32;
  const startOffset = isPreSale ? 14 : 0;
  const dayCount = isPreSale ? 16 : 3;
  
  for (let i = startOffset; i < startOffset + dayCount; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const fullDate = date.toISOString().split('T')[0];
    
    dates.push({
      label: dayName,
      date: dayMonth,
      fullDate
    });
  }
  
  return dates;
};

export const getAvailableTimes = (showtimes: Showtime[], selectedDate: string, selectedFormat: string): string[] => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const today = now.toISOString().split('T')[0];
  
  return showtimes
    .filter(showtime => {
      if (showtime.date !== selectedDate || showtime.format !== selectedFormat) return false;
      
      // Only apply time filter for today's showings
      if (selectedDate === today) {
        const [hours, minutes] = showtime.time.split(':').map(Number);
        const showtimeMinutes = hours * 60 + minutes;
        return showtimeMinutes >= currentTime + 120;
      }
      
      return true;
    })
    .map(showtime => showtime.time)
    .sort();
};