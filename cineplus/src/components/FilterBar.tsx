import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sliders } from "react-feather";

import { cines } from "../data/cines";
import { peliculas } from "../data/peliculas";
import getDateOptions from "../data/dateOptions";


// Extraer títulos de películas únicos
const movieOptions = Array.from(new Set(peliculas.map(p => p.titulo)));

// Extraer ciudades únicas de los cines
const cityOptions = Array.from(new Set(cines.map(c => c.ciudad)));



// Devuelve los cines (por localidad) para una ciudad dada
const getCinesByCity = (city: string) => {
  if (!city) return [];
  return cines.filter(c => c.ciudad === city);
};

const dateOptions = getDateOptions();

const FilterBar: React.FC = () => {
  const [movie, setMovie] = useState("");
  const [city, setCity] = useState("");
  const [cinema, setCinema] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  const isReady = movie && city && cinema && date;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReady) {
      // Puedes pasar los filtros como query params si lo deseas
      navigate("/cartelera");
    }
  };

  return (
  <section className="flex justify-center w-full -mt-12 z-20 relative">
      <form
        style={{ background: "var(--cineplus-gray-light)" }}
        className="shadow-lg rounded-md flex flex-col md:flex-row items-stretch px-2 py-4 gap-4 md:gap-0 w-full max-w-2xl md:min-w-[700px]"
        onSubmit={handleSubmit}
      >
        {/* Filtro 1 */}
        <div className="flex flex-col justify-center flex-1 min-w-0 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por película</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full"
            style={{ color: "var(--cineplus-gray)", border: "none" }}
            value={movie}
            onChange={e => setMovie(e.target.value)}
          >
            <option value="">Qué quieres ver</option>
            {movieOptions.map((title, index) => (
              <option key={index} value={title}>{title}</option>
            ))}
          </select>
        </div>

        {/* Filtro 2 */}
        <div className="flex flex-col justify-center flex-1 min-w-0 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por ciudad</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full"
            style={{ color: "var(--cineplus-gray)", border: "none" }}
            value={city}
            onChange={e => {
              setCity(e.target.value);
              setCinema(""); // Reinicia el cine seleccionado al cambiar ciudad
            }}
          >
            <option value="">Dónde estás</option>
            {cityOptions.map((city, index) => (
              <option key={index} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Filtro 3 */}
        <div className="flex flex-col justify-center flex-1 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por cine/localidad</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full"
            style={{ color: "var(--cineplus-gray)", border: "none" }}
            value={cinema}
            onChange={e => setCinema(e.target.value)}
            disabled={!city}
          >
            <option value="">Elige tu cine/localidad</option>
            {getCinesByCity(city).map((cine) => (
              <option key={cine.id} value={cine.id}>
                {cine.localidad} ({cine.nombre})
              </option>
            ))}
          </select>
        </div>

        {/* Filtro 4 */}
        <div className="flex flex-col justify-center flex-1 px-0 md:px-6">
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por fecha</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full"
            style={{ color: "var(--cineplus-gray)", border: "none" }}
            value={date}
            onChange={e => setDate(e.target.value)}
          >
            <option value="">Elige un día</option>
            {dateOptions.map((date, index) => (
              <option key={index} value={date}>{date}</option>
            ))}
          </select>
        </div>

        {/* Botón */}
        <div className="flex items-center justify-center pt-2 md:pt-0 md:pl-6 w-full md:w-auto">
          <button
            type="submit"
            disabled={!isReady}
            className={`flex items-center gap-2 font-semibold rounded-full px-6 py-2 transition w-full md:w-auto
              ${isReady
                ? "bg-[var(--cineplus-gray-dark)] text-[var(--cineplus-gray-light)] hover:bg-[var(--cineplus-black)]"
                : "bg-[var(--cineplus-gray)] text-[var(--cineplus-gray-light)] cursor-not-allowed"
              }`}
            style={{ border: "none" }}
          >
            <Sliders size={18} />
            Filtrar
          </button>
        </div>
      </form>
    </section>
  );
};

export default FilterBar;
