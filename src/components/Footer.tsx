import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="cineplus-footer">
      <div className="footer-columns">
        <div className="col">
          <strong>Nosotros</strong>
          <ul>
            <li>Conócenos</li>
            <li>Trabaja con nosotros</li>
            <li>Ventas Corporativas</li>
            <li>Memoria de Gestión de Sostenibilidad 2024</li>
            <li>Huella de Carbono</li>
          </ul>
        </div>
        <div className="col">
          <strong>Atención al cliente</strong>
          <ul>
            <li>Centro de Ayuda</li>
            <li>Ver mi boleta electrónica</li>
            <li>Ver lista de productos permitidos</li>
            <li>Atención de Consultas o Incidencias por mail</li>
            <li>Libro de Reclamaciones</li>
          </ul>
        </div>
        <div className="col">
          <strong>Políticas y condiciones</strong>
          <ul>
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
      <div className="footer-bottom">
        <span>Cineplus S.A. Todos los derechos reservados 2025</span>
        <span>Descarga la app | Síguenos en redes sociales</span>
      </div>
    </footer>
  );
};

export default Footer;
