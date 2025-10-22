import React from "react";
import Navbar from "../components/Navbar";

const AtencionCliente: React.FC = () => {
  return (
  <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      <Navbar />
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Atención al Cliente</h2>
        {/* Aquí iría la interfaz de atención al cliente */}
      </div>
    </div>
  );
};

export default AtencionCliente;
