import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import type { Cinema } from '../types/Cinema';
import { getAllCinemas } from '../services/cinemaService';
import Footer from '../components/Footer';
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
    <div className="bg-black min-h-screen">
      <Navbar />
      <div className="container mx-auto p-8 pt-20">
        <h1 className="text-4xl font-bold text-white mb-6">Cines</h1>

        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="bg-white p-3 rounded-lg w-1/3 glassmorphism transition-all duration-300">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-2 rounded bg-transparent"
              >
                <option value="Todas las ciudades">Todas las ciudades</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="bg-white p-3 rounded-lg w-1/3 glassmorphism transition-all duration-300">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full p-2 rounded bg-transparent"
              >
                <option value="Todos los formatos">Todos los formatos</option>
                {uniqueFormats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="cine-card bg-white rounded-lg shadow-lg p-4 cursor-pointer transform transition-transform hover:scale-105 glassmorphism"
              onClick={() => handleCineClick(cinema)}
            >
              <img
                src={cinema.image}
                alt={cinema.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <h3 className="text-lg font-bold mt-4">{cinema.name}</h3>
              <p className="text-gray-600">{cinema.address}</p>
              <div className="mt-2">
                {cinema.availableFormats.map((format, index) => (
                  <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                    {format}
                  </span>
                ))}
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