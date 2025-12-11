import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
// Cinema type import removed (not used directly)
import { useCinemas } from '../hooks/useCinemas';
import Footer from '../components/Footer';
import { FaMapMarkerAlt, FaFilm, FaBuilding } from 'react-icons/fa';

const Cines = () => {
  const { data: cinemas = [], isLoading, isError } = useCinemas();
  const [selectedCity, setSelectedCity] = useState("Todas las ciudades");
  const [selectedFormat, setSelectedFormat] = useState("Todos los formatos");
  const navigate = useNavigate();

  const handleCineClick = (cineName: string) => {
    localStorage.setItem("selectedCine", cineName);
    navigate(`/cartelera?cine=${cineName}`);
  };

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen">
        <Navbar />
        <div className="container mx-auto p-8 pt-20 text-white">
          Cargando cines...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-black min-h-screen">
        <Navbar />
        <div className="container mx-auto p-8 pt-20 text-white">
          <p>Error cargando cines.</p>
        </div>
      </div>
    );
  }

  const filteredCinemas = cinemas.filter(cinema => {
    const cityMatch = selectedCity === "Todas las ciudades" || cinema.city === selectedCity;
    const formatMatch = selectedFormat === "Todos los formatos" || 
      (cinema.availableFormats?.includes(selectedFormat) ?? false);
    return cityMatch && formatMatch;
  });

  const uniqueCities = Array.from(new Set(cinemas.map(cinema => cinema.city)));
  const uniqueFormats = Array.from(new Set(cinemas.flatMap(cinema => cinema.availableFormats || [])));

  return (
    <div className="min-h-screen pt-16 text-neutral-100" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        {/* Header premium con gradiente */}
        <div className="mb-8 pb-4 border-b border-white/5 animate-slide-up">
          <h1 className="text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
            <FaBuilding className="inline-block text-[2.2rem]" /> Cines
          </h1>
          <p className="text-neutral-400 text-lg">Descubre todos nuestros cines y formatos disponibles</p>
        </div>

        {/* Filtros con glassmorphism */}
        <div className="mb-10 flex flex-col md:flex-row gap-4">
          <div className="flex-1 card-glass p-4 rounded-xl shadow-md flex items-center gap-2 animate-slide-up">
            <FaBuilding className="text-[1.3rem] text-[#BB2228] mr-2" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-2 rounded-lg bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-[#BB2228]"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="Todas las ciudades">Todas las ciudades</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 card-glass p-4 rounded-xl shadow-md flex items-center gap-2 animate-slide-up">
            <FaFilm className="text-[1.3rem] text-[#BB2228] mr-2" />
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full p-2 rounded-lg bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-[#BB2228]"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="Todos los formatos">Todos los formatos</option>
              {uniqueFormats.map(format => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de cines con animación y glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCinemas.map((cinema, idx) => (
            <div
              key={cinema.id}
              className="card-glass rounded-2xl shadow-xl p-0 cursor-pointer transform transition-transform hover:scale-105 hover:shadow-2xl group flex flex-col animate-scale-in"
              style={{ minHeight: 340, animationDelay: `${idx * 0.07}s` }}
              onClick={() => handleCineClick(cinema.name)}
            >
              <div className="relative">
                <img
                  src={cinema.image}
                  alt={cinema.name}
                  className="w-full h-48 object-cover rounded-t-2xl group-hover:brightness-90 transition duration-200"
                  style={{ borderBottom: '1px solid #E3E1E2' }}
                />
                <span className="absolute top-3 left-3 bg-gradient-to-r from-[#BB2228] to-[#8B191E] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <FaBuilding className="inline-block mr-1" /> {cinema.city}
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between p-4">
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#BB2228] transition-colors duration-300">{cinema.name}</h3>
                <p className="text-neutral-400 flex items-center gap-2 mb-2">
                  <FaMapMarkerAlt className="text-[#BB2228]" />
                  <span>{cinema.address}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cinema.availableFormats?.map((format, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold text-[#BB2228] shadow">
                      <FaFilm className="text-[#BB2228]" /> {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cines;