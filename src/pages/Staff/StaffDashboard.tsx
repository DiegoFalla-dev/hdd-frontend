import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getAllCinemas } from '../../services/cinemaService';
import { fetchAllMovies } from '../../services/moviesService';
import api from '../../services/apiClient';

export default function StaffDashboard() {
  const [moviesCount, setMoviesCount] = useState<number>(0);
  const [cinemasCount, setCinemasCount] = useState<number>(0);
  const [showtimesCount, setShowtimesCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Obtener datos directamente de los endpoints existentes
        const [movies, cinemas] = await Promise.all([
          fetchAllMovies(),
          getAllCinemas()
        ]);
        
        setMoviesCount(Array.isArray(movies) ? movies.length : 0);
        setCinemasCount(Array.isArray(cinemas) ? cinemas.length : 0);
        
        // Obtener count de usuarios
        try {
          const usersResponse = await api.get('/users/count');
          setUsersCount(typeof usersResponse.data === 'number' ? usersResponse.data : 0);
        } catch {
          setUsersCount(0);
        }
        
        // Para showtimes, obtener todos los showtimes de todos los cines
        try {
          const showtimesPromises = cinemas.map(cinema => 
            api.get(`/showtimes?cinema=${cinema.id}`).catch(() => ({ data: [] }))
          );
          const showtimesResponses = await Promise.all(showtimesPromises);
          const totalShowtimes = showtimesResponses.reduce((sum, resp) => {
            const data = Array.isArray(resp.data) ? resp.data : [];
            return sum + data.length;
          }, 0);
          setShowtimesCount(totalShowtimes);
        } catch (showtimeError) {
          console.error('Error loading showtimes:', showtimeError);
          setShowtimesCount(0);
        }
      } catch (e) {
        console.error('Error loading stats:', e);
        setMoviesCount(0);
        setCinemasCount(0);
        setShowtimesCount(0);
        setUsersCount(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { 
      label: 'Películas', 
      value: moviesCount, 
      icon: '🎬'
    },
    { 
      label: 'Cines', 
      value: cinemasCount, 
      icon: '🏢'
    },
    { 
      label: 'Funciones', 
      value: showtimesCount, 
      icon: '🎞️'
    },
    { 
      label: 'Usuarios', 
      value: usersCount, 
      icon: '👥'
    }
  ];

  const managementCards = [
    {
      title: 'Gestionar Películas',
      description: 'Administra el catálogo de películas',
      icon: '🎬',
      path: 'movies'
    },
    {
      title: 'Gestionar Salas',
      description: 'Configura salas y capacidades',
      icon: '🎭',
      path: 'theaters'
    },
    {
      title: 'Gestionar Funciones',
      description: 'Programa horarios de películas',
      icon: '🎞️',
      path: 'showtimes'
    },
    {
      title: 'Gestionar Usuarios',
      description: 'Administra usuarios del sistema',
      icon: '👥',
      path: 'users'
    },
    {
      title: 'Gestionar Promociones',
      description: 'Crea y administra códigos promocionales',
      icon: '🎟️',
      path: 'promotions'
    }
  ];

  return (
    <ProtectedRoute roles={["STAFF", "ADMIN"]}>
      <div style={{ background: "linear-gradient(180deg, #141113 0%, #0b0b0b 100%)" }} className="min-h-screen">
        <Navbar variant="dark" />
        
        {/* Header Premium */}
        <div className="relative pt-24 pb-12 px-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-6 mb-2">
              <div className="text-6xl">⚡</div>
              <div className="flex-1">
                <h1 className="text-5xl font-black bg-gradient-to-r from-[#BB2228] to-[#E3E1E2] bg-clip-text text-transparent">
                  Panel de Administración
                </h1>
                <p className="text-lg text-[#E3E1E2]/70 mt-2 font-semibold">Gestión completa del sistema CinePlus</p>
              </div>
            </div>
            <div className="w-32 h-1.5 bg-gradient-to-r from-[#BB2228] to-[#8B191E] rounded-full mt-4"></div>
          </div>
        </div>

        <div className="px-8 pb-12 max-w-7xl mx-auto -mt-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="card-glass rounded-2xl p-8 relative overflow-hidden group hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BB2228] to-[#8B191E] flex items-center justify-center text-3xl">
                      {stat.icon}
                    </div>
                    {loading && (
                      <div className="animate-pulse bg-[#E3E1E2]/20 h-6 w-16 rounded-lg"/>
                    )}
                  </div>
                  <div className="text-sm text-[#E3E1E2]/60 mb-2 font-semibold">{stat.label}</div>
                  <div className="text-4xl font-black bg-gradient-to-r from-[#EFEFEE] to-[#E3E1E2] bg-clip-text text-transparent">
                    {loading ? '...' : stat.value}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#BB2228] to-[#8B191E]"/>
              </div>
            ))}
          </div>

          {/* Sección de gestión */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              Módulos de Gestión
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {managementCards.map((card, idx) => (
                <Link
                  key={idx}
                  to={card.path}
                  className="card-glass rounded-2xl p-8 relative overflow-hidden group hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br from-[#BB2228] to-[#8B191E] opacity-5 group-hover:opacity-15 transition-opacity duration-300`}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                        {card.icon}
                      </span>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BB2228] to-[#8B191E] opacity-30 group-hover:opacity-60 transition-opacity flex items-center justify-center group-hover:scale-110"
                      >
                        <span className="text-white text-xl">→</span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black mb-2 text-[#EFEFEE] group-hover:text-white transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[#E3E1E2]/70 text-sm group-hover:text-[#E3E1E2]/90 transition-colors font-semibold">
                      {card.description}
                    </p>
                  </div>

                  <div 
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#BB2228] to-[#8B191E] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Acceso rápido */}
          <div className="card-glass rounded-2xl p-8 animate-slide-up">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚡</span>
              Accesos Rápidos
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link 
                to="movies" 
                className="btn-primary-gradient px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
              >
                + Nueva Película
              </Link>
              <Link 
                to="theaters" 
                className="btn-primary-gradient px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
              >
                + Nueva Sala
              </Link>
              <Link 
                to="showtimes" 
                className="btn-primary-gradient px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
              >
                + Nueva Función
              </Link>
              <Link 
                to="users" 
                className="btn-primary-gradient px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
              >
                + Nuevo Usuario
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
