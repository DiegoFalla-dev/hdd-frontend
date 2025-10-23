import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import type { Cinema } from '../types/Cinema';
import { getAllCinemas } from '../services/cinemaService';
import Footer from '../components/Footer';
import { FaMapMarkerAlt, FaFilm, FaBuilding } from 'react-icons/fa';
import { cinemaStorage } from '../utils/cinemaStorage';

const Cines = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCity, setSelectedCity] = useState("Todas las ciudades");
  const [selectedFormat, setSelectedFormat] = useState("Todos los formatos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const data = await getAllCinemas();
        setCinemas(data);
        setLoading(false);
      } catch (err: unknown) {
        setError('Error al cargar los cines');
        console.error('Error fetching cinemas:', err);
        setLoading(false);
      }
    };

    fetchCinemas();
  }, []);

  const handleCineClick = (cinema: Cinema) => {
    cinemaStorage.save(cinema);
    navigate(`/cartelera?cine=${cinema.name}`);
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen">
        <Navbar />
        <div className="container mx-auto p-8 pt-20 text-white">
          Cargando cines...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black min-h-screen">
        <Navbar />
        <div className="container mx-auto p-8 pt-20 text-white">
          {error}
        </div>
      </div>
    );
  }

  const filteredCinemas = cinemas.filter(cinema => {
    const cityMatch = selectedCity === "Todas las ciudades" || cinema.city === selectedCity;
    const formatMatch = selectedFormat === "Todos los formatos" || 
      cinema.availableFormats.includes(selectedFormat);
    return cityMatch && formatMatch;
  });

  const uniqueCities = Array.from(new Set(cinemas.map(cinema => cinema.city)));
  const uniqueFormats = Array.from(new Set(cinemas.flatMap(cinema => cinema.availableFormats)));

  return (
    <div className="min-h-screen" style={{ background: 'var(--cinepal-gray-900)' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 flex items-center gap-3" style={{ color: 'var(--cinepal-primary)' }}>
          <FaBuilding className="inline-block text-[2.2rem]" /> Cines
        </h1>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 --cinepal-gray-700/80 backdrop-blur-md p-4 rounded-xl shadow-md flex items-center gap-2 border border-[var(--cinepal-gray-700)]">
            <FaBuilding className="text-[1.3rem] text-[var(--cinepal-primary)] mr-2" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-2 rounded-lg bg-transparent text-[var(--cinepal-bg-100)] focus:outline-none focus:ring-2 focus:ring-[var(--cinepal-primary)]"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="Todas las ciudades">Todas las ciudades</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 --cinepal-gray-700/80 backdrop-blur-md p-4 rounded-xl shadow-md flex items-center gap-2 border border-[var(--cinepal-gray-700)]">
            <FaFilm className="text-[1.3rem] text-[var(--cinepal-primary)] mr-2" />
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full p-2 rounded-lg bg-transparent text-[var(--cinepal-bg-100)] focus:outline-none focus:ring-2 focus:ring-[var(--cinepal-primary)]"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="Todos los formatos">Todos los formatos</option>
              {uniqueFormats.map(format => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="cine-card bg-gray rounded-2xl shadow-lg p-0 cursor-pointer transform transition-transform hover:scale-105 hover:shadow-2xl border border-[var(--cinepal-gray-700)] group flex flex-col"
              onClick={() => handleCineClick(cinema)}
              style={{ minHeight: 340 }}
            >
              <div className="relative">
                <img
                  src={cinema.image}
                  alt={cinema.name}
                  className="w-full h-48 object-cover rounded-t-2xl group-hover:brightness-90 transition duration-200"
                  style={{ borderBottom: '1px solid var(--cinepal-bg-100)' }}
                />
                <span className="absolute top-3 left-3 bg-[var(--cinepal-primary)] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <FaBuilding className="inline-block mr-1" /> {cinema.city}
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between p-4">
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--cinepal-bg-100)' }}>{cinema.name}</h3>
                <p className="text-gray-700 flex items-center gap-2 mb-2">
                  <FaMapMarkerAlt className="text-[var(--cinepal-primary)]" /><p className="text-[var(--cinepal-bg-100)]">
                    {cinema.address}
                    </p> 
                  </p>

                <div className="flex flex-wrap gap-2 mt-2 --cinepal-bg-100">
                  {cinema.availableFormats.map((format, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-[var(--cinepal-bg-200)] rounded-full px-3 py-1 text-xs font-semibold text-[var(--cinepal-gray-700)] shadow">
                      <FaFilm className="text-[var(--cinepal-primary-700)]" /> {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cines;