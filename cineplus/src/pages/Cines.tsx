import React, { useState } from "react";
import Navbar from "../components/Navbar";
import asiaImage from '../images/asia.png';
import { useNavigate } from "react-router-dom";
import gamarra from '../images/gamarra.png';
import jockey from '../images/jockey.png';
import lambra from '../images/lambra.png';
import arequipa from '../images/arequipa.png';
import angamos from '../images/angamos.png';
import bellavista from '../images/bellavista.png';

const Cines = () => {
  const [selectedCity, setSelectedCity] = useState("Todas las ciudades");
  const [selectedFormat, setSelectedFormat] = useState("Todos los formatos");
  const navigate = useNavigate();

  const cines = [
    { name: "Cineplus Asia", address: "Av. Santa Cruz 814-816", formats: ["2D"], image: asiaImage },
    { name: "Cineplus Gamarra", address: "Av. Ejercito 793 Cayma", formats: ["2D"], image: gamarra },
    { name: "Cineplus Jockey Plaza", address: "Av. Arturo Ibáñez S/N", formats: ["2D"], image: jockey },
    { name: "Cineplus Lambramani", address: "Av. Ejercito 1009 Cayma", formats: ["2D"], image: lambra },
    { name: "Cineplus Mall Ave Pza Arequipa", address: "Av. Ejercito 1009 Cayma", formats: ["2D"], image: arequipa },
    { name: "Cineplus MallPlaza Angamos", address: "Av. Ejercito 1009 Cayma", formats: ["2D"], image: angamos },
    { name: "Cineplus Mallplaza Bellavista", address: "Av. Ejercito 1009 Cayma", formats: ["2D"], image: bellavista },
  ];

  const handleCineClick = (cineName: string) => {
    localStorage.setItem("selectedCine", cineName); // Guardar cine seleccionado en localStorage
    navigate(`/cartelera?cine=${cineName}`); // Redirigir a la cartelera pasando la sede como parámetro
  };

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <div className="container mx-auto p-8 pt-20">
        <h1 className="text-4xl font-bold text-white mb-6">Cines</h1>

        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="bg-white p-3 rounded-lg w-1/3 glassmorphism transition-all duration-300">
              <label className="block text-white">Por Ciudad</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="mt-2 p-2 w-full rounded-lg bg-white text-black transition-all duration-300"
              >
                <option value="Todas las ciudades">Todas las ciudades</option>
                <option value="Arequipa">Arequipa</option>
                <option value="Lima">Lima</option>
                <option value="Cajamarca">Cajamarca</option>
              </select>
            </div>
            <div className="bg-white p-3 rounded-lg w-1/3 glassmorphism transition-all duration-300">
              <label className="block text-white">Por Formato</label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="mt-2 p-2 w-full rounded-lg bg-white text-black transition-all duration-300"
              >
                <option value="Todos los formatos">Todos los formatos</option>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cines.map((cine) => (
            <div
              key={cine.name}
              className="cine-card bg-white rounded-lg shadow-lg p-4 cursor-pointer transform transition-transform hover:scale-105 glassmorphism"
              onClick={() => handleCineClick(cine.name)}
            >
              <img
                src={cine.image}
                alt={cine.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <h2 className="text-xl font-semibold mt-4">{cine.name}</h2>
              <p className="text-bg-[#9E9E9E]">{cine.address}</p>
              <p className="text-bg-[#878787]">{cine.formats.join(", ")}</p>
              <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg">
                Ver funciones
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer sección agregada al final */}
      <div className="bg-[#595959] text-white p-8 mt-12">
        <h2 className="text-xl font-bold mb-6">Información importante</h2>
        <p className="text-gray-300 mb-8">
          Recuerda que el horario mostrado corresponde a la hora del inicio de la publicidad.
          El horario de apertura del cine es 20 minutos antes de la primera función programada.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-bold mb-3">Acerca de Cineplanet</h3>
            <ul>
              <li><a href="#" className="text-gray-300">Nosotros</a></li>
              <li><a href="#" className="text-gray-300">Trabaja en Cineplanet</a></li>
              <li><a href="#" className="text-gray-300">Ventas Corporativas</a></li>
              <li><a href="#" className="text-gray-300">Política de SST</a></li>
              <li><a href="#" className="text-gray-300">Política de Diversidad e Inclusión</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Sostenibilidad</h3>
            <ul>
              <li><a href="#" className="text-gray-300">Política de Sostenibilidad</a></li>
              <li><a href="#" className="text-gray-300">Memoria de Gestión de Sostenibilidad 2024</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Ayuda y Contacto</h3>
            <ul>
              <li><a href="#" className="text-gray-300">Centro de Ayuda</a></li>
              <li><a href="#" className="text-gray-300">Contáctanos</a></li>
              <li><a href="#" className="text-gray-300">Boleta Electrónica</a></li>
              <li><a href="#" className="text-gray-300">Lista de productos permitidos</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cines;