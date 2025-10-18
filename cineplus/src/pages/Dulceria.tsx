import { useEffect } from "react";
import Navbar from "../components/Navbar";

export default function Dulceria() {
  useEffect(() => {
    const selectedCine = localStorage.getItem("selectedCine");
    if (!selectedCine) {
      const timer = setTimeout(() => {
        const elegirCineButton = document.querySelector('button[data-elegir-cine]') as HTMLButtonElement;
        if (elegirCineButton) {
          elegirCineButton.click();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);
  return (
  <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen pt-16">
      {/* Navbar fijo solo en Dulcería */}
      <Navbar />

      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Dulcería</h1>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Canchita */}
          <div style={{ background: "var(--cineplus-gray-dark)", color: "var(--cineplus-gray-light)" }} className="rounded-lg shadow-md p-4 text-center">
            <img
              src="/images/canchita.jpg"
              alt="Canchita"
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h2 className="text-xl font-semibold">Canchita</h2>
            <p className="text-gray-600">Tamaños: pequeña, mediana, grande</p>
            <p className="text-yellow-600 font-bold mt-2">Desde S/ 8.00</p>
          </div>

          {/* Gaseosas */}
          <div style={{ background: "var(--cineplus-gray-dark)", color: "var(--cineplus-gray-light)" }} className="rounded-lg shadow-md p-4 text-center">
            <img
              src="/images/gaseosa.jpg"
              alt="Gaseosa"
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h2 className="text-xl font-semibold">Gaseosas</h2>
            <p className="text-gray-600">Marcas clásicas y variedades</p>
            <p className="text-yellow-600 font-bold mt-2">Desde S/ 6.00</p>
          </div>

          {/* Promociones */}
          <div style={{ background: "var(--cineplus-gray-dark)", color: "var(--cineplus-gray-light)" }} className="rounded-lg shadow-md p-4 text-center">
            <img
              src="/images/promocion.jpg"
              alt="Promociones"
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h2 className="text-xl font-semibold">Promociones</h2>
            <p className="text-gray-600">
              Combos de canchita + gaseosa a precios especiales
            </p>
            <p className="text-yellow-600 font-bold mt-2">Desde S/ 12.00</p>
          </div>
        </div>
      </div>
    </div>
  );
}