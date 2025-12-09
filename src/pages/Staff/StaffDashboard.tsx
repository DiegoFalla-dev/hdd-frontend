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
      icon: '🎬',
      color: 'from-red-500 to-red-600',
      bgCard: 'var(--cinepal-gray-800)'
    },
    { 
      label: 'Cines', 
      value: cinemasCount, 
      icon: '🏢',
      color: 'from-red-600 to-red-700',
      bgCard: 'var(--cinepal-gray-800)'
    },
    { 
      label: 'Funciones', 
      value: showtimesCount, 
      icon: '🎞️',
      color: 'from-red-500 to-orange-600',
      bgCard: 'var(--cinepal-gray-800)'
    },
    { 
      label: 'Usuarios', 
      value: usersCount, 
      icon: '👥',
      color: 'from-red-600 to-pink-600',
      bgCard: 'var(--cinepal-gray-800)'
    }
  ];

  const managementCards = [
    {
      title: 'Gestionar Películas',
      description: 'Administra el catálogo de películas',
      icon: '🎬',
      path: 'movies',
      gradient: 'from-red-600 to-red-700'
    },
    {
      title: 'Gestionar Salas',
      description: 'Configura salas y capacidades',
      icon: '🎭',
      path: 'theaters',
      gradient: 'from-red-700 to-red-800'
    },
    {
      title: 'Gestionar Funciones',
      description: 'Programa horarios de películas',
      icon: '🎞️',
      path: 'showtimes',
      gradient: 'from-red-600 to-orange-600'
    },
    {
      title: 'Gestionar Usuarios',
      description: 'Administra usuarios del sistema',
      icon: '👥',
      path: 'users',
      gradient: 'from-red-600 to-pink-600'
    }
  ];

  return (
    <ProtectedRoute roles={["STAFF", "ADMIN"]}>
      <div style={{ background: "var(--cinepal-gray-900)", color: "var(--cinepal-bg-100)" }} className="min-h-screen">
        <Navbar variant="dark" />
        
        {/* Header con gradiente */}
        <div className="relative pt-24 pb-12 px-8" style={{ 
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(127, 29, 29, 0.1) 100%)'
        }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <div className="text-5xl">⚡</div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  Panel de Administración
                </h1>
                <p className="text-gray-400 mt-1">Gestión completa del sistema CinePlus</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-12 max-w-7xl mx-auto -mt-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="rounded-xl p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300"
                style={{ 
                  backgroundColor: stat.bgCard,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Gradiente de fondo sutil */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{stat.icon}</span>
                    {loading && (
                      <div className="animate-pulse bg-gray-600 h-4 w-12 rounded"/>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {loading ? '...' : stat.value}
                  </div>
                </div>

                {/* Borde gradiente */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
                />
              </div>
            ))}
          </div>

          {/* Sección de gestión */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              Módulos de Gestión
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {managementCards.map((card, idx) => (
                <Link
                  key={idx}
                  to={card.path}
                  className="group rounded-xl p-8 relative overflow-hidden hover:scale-105 transition-all duration-300"
                  style={{ 
                    backgroundColor: 'var(--cinepal-gray-800)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {/* Gradiente de fondo */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />
                  
                  {/* Contenido */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                        {card.icon}
                      </span>
                      <div 
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${card.gradient} opacity-20 group-hover:opacity-40 transition-opacity flex items-center justify-center`}
                      >
                        <span className="text-white text-xl">→</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                      {card.description}
                    </p>
                  </div>

                  {/* Borde gradiente en hover */}
                  <div 
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Acceso rápido */}
          <div className="rounded-xl p-6" style={{ 
            backgroundColor: 'var(--cinepal-gray-800)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚡</span>
              Accesos Rápidos
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link 
                to="movies" 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--cinepal-gray-700)',
                  color: 'var(--cinepal-bg-100)'
                }}
              >
                + Nueva Película
              </Link>
              <Link 
                to="theaters" 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--cinepal-gray-700)',
                  color: 'var(--cinepal-bg-100)'
                }}
              >
                + Nueva Sala
              </Link>
              <Link 
                to="showtimes" 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--cinepal-gray-700)',
                  color: 'var(--cinepal-bg-100)'
                }}
              >
                + Nueva Función
              </Link>
              <Link 
                to="users" 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--cinepal-gray-700)',
                  color: 'var(--cinepal-bg-100)'
                }}
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
