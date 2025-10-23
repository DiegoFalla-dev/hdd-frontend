import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12" style={{ backgroundColor: 'var(--cinepal-gray-900)', color: 'var(--cinepal-bg-100)' }}>
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <strong className="block text-lg mb-3">Nosotros</strong>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li>Conócenos</li>
            <li>Trabaja con nosotros</li>
            <li>Ventas Corporativas</li>
            <li>Memoria de Gestión de Sostenibilidad 2024</li>
            <li>Huella de Carbono</li>
          </ul>
        </div>
        <div>
          <strong className="block text-lg mb-3">Atención al cliente</strong>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li>Centro de Ayuda</li>
            <li>Ver mi boleta electrónica</li>
            <li>Ver lista de productos permitidos</li>
            <li>Atención de Consultas o Incidencias por mail</li>
            <li>Libro de Reclamaciones</li>
          </ul>
        </div>
        <div>
          <strong className="block text-lg mb-3">Políticas y condiciones</strong>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li>Política de SST</li>
            <li>Política de Sostenibilidad</li>
            <li>Política de Diversidad e Inclusión</li>
            <li>Política de Privacidad</li>
            <li>Condiciones de uso y seguridad</li>
            <li>Reglas de Convivencia</li>
            <li>Términos y condiciones</li>
          </ul>
        </div>
      </div>
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between text-sm text-neutral-400">
          <span>Cineplus S.A. Todos los derechos reservados 2025</span>
          <span>Descarga la app | Síguenos en redes sociales</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
