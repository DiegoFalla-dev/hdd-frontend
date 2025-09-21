// Modelo de datos para películas
export interface Pelicula {
  id: string;
  titulo: string;
  sinopsis: string;
  genero: string;
  clasificacion: string;
  duracion: string;
  banner?: string; // 1280x480px o 1920x720px
  imagenCard?: string; // 414x621px o 600x900px
  trailerUrl?: string;
  reparto?: string[];
  horarios?: string[];
}

// Ejemplo de películas almacenadas
export const peliculas: Pelicula[] = [
  {
    id: '1',
    titulo: 'Demon Slayer: Kimetsu no Yaiba – Castillo Infinito',
    sinopsis: 'Tanjiro y sus amigos enfrentan nuevos desafíos en el Castillo Infinito.',
    genero: 'Animación, Acción',
    clasificacion: 'APT',
    duracion: '2h 0m',
    trailerUrl: '',
    reparto: [],
    horarios: ['15:00', '18:00', '20:30'],
      banner: '', // 1280x480px recomendado
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002431?referenceScheme=HeadOffice&allowPlaceHolder=true', // 414x621px recomendado
  },
  {
    
    id: '2',
    titulo: 'Camina o Muere',
    sinopsis: 'Un grupo de jóvenes debe sobrevivir en un mundo postapocalíptico donde caminar es la única opción para sobrevivir.',
    genero: 'Acción, Ciencia Ficción',
    clasificacion: 'PG-13',
    duracion: '1h 50m',
    trailerUrl: '',
    reparto: [],
    horarios: ['16:00', '19:00', '21:30'],
      banner: '', // 1280x480px recomendado
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002473?referenceScheme=HeadOffice&allowPlaceHolder=true', // 414x621px recomendado
  },
  
  {
    id: '3',
    titulo: 'Toy Story (30 aniversario)',
    sinopsis: 'Celebrando 30 años, revive la aventura original de Woody y Buzz.',
    genero: 'Animación, Aventura',
    clasificacion: 'APT',
    duracion: '1h 25m',
    trailerUrl: '',
    reparto: [],
    horarios: ['14:00', '17:00', '20:00'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002588?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '4',
    titulo: 'El Conjuro 4: Últimos Ritos',
    sinopsis: 'La saga de terror continúa con un nuevo caso sobrenatural.',
    genero: 'Terror',
    clasificacion: '16',
    duracion: '1h 55m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['18:00', '21:00'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002490?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '5',
    titulo: 'Together: Juntos hasta la muerte',
    sinopsis: 'Una historia de amor y supervivencia que desafía el destino.',
    genero: 'Drama, Romance',
    clasificacion: 'PG-13',
    duracion: '1h 40m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['25 de septiembre'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002472?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '6',
    titulo: 'Función secreta',
    sinopsis: 'Si estás buscando una forma emocionante de disfrutar de una película, esta Función Secreta es una oportunidad que no querrás perderte. Prepárate para una experiencia cinematográfica única y mantén el misterio hasta el último momento.',
    genero: 'Documental',
    clasificacion: 'PG',
    duracion: '1h 20m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['25 de septiembre'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002633?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '7',
    titulo: 'La Casa de Muñecas de Gabby',
    sinopsis: 'Gabby y sus amigos viven mágicas aventuras en su casa de muñecas.',
    genero: 'Animación, Infantil',
    clasificacion: 'APT',
    duracion: '1h 10m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['25 de septiembre'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002475?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '8',
    titulo: 'Los Extraños: Capítulo 2',
    sinopsis: 'La saga de terror continúa con nuevos horrores.',
    genero: 'Terror',
    clasificacion: '16',
    duracion: '1h 45m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['25 de septiembre'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002486?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '9',
    titulo: 'My Storylof',
    sinopsis: 'Una historia de amor y autodescubrimiento.',
    genero: 'Romance',
    clasificacion: 'PG',
    duracion: '1h 30m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['25 de septiembre'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002599?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '10',
    titulo: 'Hamilton',
    sinopsis: 'La versión filmada de la producción original de Broadway.',
    genero: 'Musical',
    clasificacion: 'PG-13',
    duracion: '2h 40m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['25 de septiembre'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002630?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '11',
    titulo: 'Kygo: Back at the Bowl',
    sinopsis: 'El famoso DJ Kygo en un concierto inolvidable.',
    genero: 'Concierto, Musical',
    clasificacion: 'APT',
    duracion: '1h 50m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['26 de septiembre'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002617?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '12',
    titulo: 'Cazadores del Fin del Mundo',
    sinopsis: 'Un grupo de cazadores enfrenta el apocalipsis.',
    genero: 'Acción, Aventura',
    clasificacion: 'PG-13',
    duracion: '2h 10m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['2 de octubre'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002595?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  // Cartelera Cinemark
  {
    id: '13',
    titulo: 'Una Velada con Dua Lipa',
    sinopsis: 'Un concierto exclusivo con la estrella pop Dua Lipa.',
    genero: 'Concierto, Musical',
    clasificacion: 'APT',
    duracion: '2h 00m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['19:00', '21:30'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002608?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '14',
    titulo: 'Homo Argentum',
    sinopsis: 'Un documental sobre la identidad y cultura argentina.',
    genero: 'Documental',
    clasificacion: 'PG',
    duracion: '1h 30m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['18:00', '20:00'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002600?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '15',
    titulo: 'El Apóstol de los Andes',
    sinopsis: 'La vida y obra de un misionero en los Andes.',
    genero: 'Drama, Biografía',
    clasificacion: 'PG',
    duracion: '1h 45m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['16:00', '19:00'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002430?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '16',
    titulo: 'Nanito',
    sinopsis: 'Una historia familiar llena de ternura y humor.',
    genero: 'Comedia, Familiar',
    clasificacion: 'APT',
    duracion: '1h 20m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['14:00', '17:00'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002592?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  {
    id: '17',
    titulo: 'Camina o Muere',
    sinopsis: 'Un grupo de jóvenes debe sobrevivir en un mundo postapocalíptico donde caminar es la única opción para sobrevivir.',
    genero: 'Acción, Ciencia Ficción',
    clasificacion: 'PG-13',
    duracion: '1h 50m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['16:00', '19:00', '21:30'],
      banner: '',
      imagenCard: '',
  },
  {
    id: '18',
    titulo: 'Los Patos y las Patas',
    sinopsis: 'Una comedia familiar sobre la vida de una familia de patos.',
    genero: 'Comedia, Familiar',
    clasificacion: 'APT',
    duracion: '1h 25m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['15:00', '18:00'],
      banner: '',
      imagenCard: 'https://cdn.apis.cineplanet.com.pe/CDN/media/entity/get/FilmPosterGraphic/HO00002481?referenceScheme=HeadOffice&allowPlaceHolder=true',
  },
  // Cartelera Cineplanet
  {
    id: '19',
    titulo: 'Camina o Muere',
    sinopsis: 'Un grupo de jóvenes debe sobrevivir en un mundo postapocalíptico donde caminar es la única opción para sobrevivir.',
    genero: 'Acción, Ciencia Ficción',
    clasificacion: 'PG-13',
    duracion: '1h 50m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['16:00', '19:00', '21:30'],
      banner: '',
      imagenCard: '',
  },
  {
    id: '20',
    titulo: 'El Conjuro 4: Últimos Ritos',
    sinopsis: 'La saga de terror continúa con un nuevo caso sobrenatural.',
    genero: 'Terror',
    clasificacion: '16',
    duracion: '1h 55m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['18:00', '21:00'],
      banner: '',
      imagenCard: '',
  },
  {
    id: '21',
    titulo: 'Demon Slayer: Castillo Infinito',
    sinopsis: 'Tanjiro y sus amigos enfrentan nuevos desafíos en el Castillo Infinito.',
    genero: 'Animación, Acción',
    clasificacion: 'APT',
    duracion: '2h 0m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['15:00', '18:00', '20:30'],
      banner: '',
      imagenCard: '',
  },
  // Próximos estrenos Cineplanet
  {
    id: '22',
    titulo: '200% Lobo',
    sinopsis: 'Freddy Lupin está decidido a demostrar que es un verdadero hombre lobo.',
    genero: 'Animación',
    clasificacion: 'APT',
    duracion: '1h 36m',
  // imagen borrada
    trailerUrl: '',
    reparto: [],
    horarios: ['Próximamente'],
      banner: '',
      imagenCard: '',
  },
];
