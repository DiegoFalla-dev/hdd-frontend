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

// Generate showtimes for next 3 days
const generateShowtimes = (movieId: string): Showtime[] => {
  const showtimes: Showtime[] = [];
  const today = new Date();
  const formats: ('2D' | '3D' | 'XD')[] = ['2D', '3D', 'XD'];
  const matrices: ('small' | 'medium' | 'large' | 'xlarge')[] = ['small', 'medium', 'large', 'xlarge'];
  const baseTimes = ['10:00', '13:00', '16:00', '19:00', '22:00'];

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
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

// Cinema data with different showtimes for each cinema
export const cinemaSchedules: Cinema[] = [
  {
    id: 'asia',
    name: 'Cineplus Asia',
    movies: [
      { movieId: '1', showtimes: generateShowtimes('1') },
      { movieId: '2', showtimes: generateShowtimes('2') },
      { movieId: '3', showtimes: generateShowtimes('3') },
      // Add more movies as needed
    ]
  },
  {
    id: 'gamarra',
    name: 'Cineplus Gamarra',
    movies: [
      { movieId: '1', showtimes: generateShowtimes('1') },
      { movieId: '2', showtimes: generateShowtimes('2') },
      { movieId: '3', showtimes: generateShowtimes('3') },
    ]
  },
  {
    id: 'jockey',
    name: 'Cineplus Jockey Plaza',
    movies: [
      { movieId: '1', showtimes: generateShowtimes('1') },
      { movieId: '2', showtimes: generateShowtimes('2') },
      { movieId: '3', showtimes: generateShowtimes('3') },
    ]
  },
  {
    id: 'lambramani',
    name: 'Cineplus Lambramani',
    movies: [
      { movieId: '1', showtimes: generateShowtimes('1') },
      { movieId: '2', showtimes: generateShowtimes('2') },
      { movieId: '3', showtimes: generateShowtimes('3') },
    ]
  },
  {
    id: 'arequipa',
    name: 'Cineplus Mall Ave Pza Arequipa',
    movies: [
      { movieId: '1', showtimes: generateShowtimes('1') },
      { movieId: '2', showtimes: generateShowtimes('2') },
      { movieId: '3', showtimes: generateShowtimes('3') },
    ]
  },
  {
    id: 'angamos',
    name: 'Cineplus MallPlaza Angamos',
    movies: [
      { movieId: '1', showtimes: generateShowtimes('1') },
      { movieId: '2', showtimes: generateShowtimes('2') },
      { movieId: '3', showtimes: generateShowtimes('3') },
    ]
  },
  {
    id: 'bellavista',
    name: 'Cineplus Mallplaza Bellavista',
    movies: [
      { movieId: '1', showtimes: generateShowtimes('1') },
      { movieId: '2', showtimes: generateShowtimes('2') },
      { movieId: '3', showtimes: generateShowtimes('3') },
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

export const getAvailableDates = (): { label: string; date: string; fullDate: string }[] => {
  const today = new Date();
  const dates = [];
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  
  for (let i = 0; i < 3; i++) {
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
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
  const today = now.toISOString().split('T')[0];
  
  return showtimes
    .filter(showtime => {
      if (showtime.date !== selectedDate || showtime.format !== selectedFormat) return false;
      
      // If it's today, filter out times that are less than 2 hours from now
      if (selectedDate === today) {
        const [hours, minutes] = showtime.time.split(':').map(Number);
        const showtimeMinutes = hours * 60 + minutes;
        return showtimeMinutes >= currentTime + 120; // 2 hours buffer
      }
      
      return true;
    })
    .map(showtime => showtime.time)
    .sort();
};