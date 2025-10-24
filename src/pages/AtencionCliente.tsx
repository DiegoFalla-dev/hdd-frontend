import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AtencionCliente: React.FC = () => {
  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Atención al Cliente</h1>
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">¿Cómo podemos ayudarte?</h2>
          <div className="space-y-4">
            <p>Contáctanos a través de nuestros canales de atención:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Teléfono: (01) 555-0123</li>
              <li>WhatsApp: +51 987 654 321</li>
              <li>Email: atencion@cineplus.com</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AtencionCliente;
