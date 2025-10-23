import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';
import authService from '../services/authService';
import SideModal from './SideModal'; // Asume que este componente existe
import { getAllCinemas } from '../services/cinemaService'; // Asume que este servicio existe
import type { Cinema } from '../types/Cinema'; // Asume que este tipo existe

const Navbar: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Lógica para obtener el usuario actual
    const u = authService.getCurrentUser();
    setUsername(u?.username ?? null);
    const onStorage = () => setUsername(authService.getCurrentUser()?.username ?? null);
    window.addEventListener('storage', onStorage);
    
    // Lógica para cargar el cine seleccionado del localStorage
    const savedCinema = localStorage.getItem('selectedCinema');
    if (savedCinema) {
      setSelectedCinema(JSON.parse(savedCinema));
    }
    
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    // Lógica para el efecto de scroll de la barra de navegación
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoading(true);
    try {
      const cinemasData = await getAllCinemas();
      setCinemas(cinemasData);
    } catch (error) {
      console.error('Error al cargar cines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCinema = (cinema: Cinema) => {
    setSelectedCinema(cinema);
  };

  const handleApply = () => {
    if (selectedCinema) {
      localStorage.setItem('selectedCinema', JSON.stringify(selectedCinema));
    }
    setIsModalOpen(false);
    // Recargar la página para aplicar el cambio del cine seleccionado
    window.location.reload(); 
  };

  return (
    <header className={`cineplus-header ${isScrolled ? 'scrolled' : 'transparent'}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <NavLink to="/" className="logo-text">
            <img src="https://i.imgur.com/K9o09F6.png" alt="Logo" className="logo-img" />
            <div className="logo-brand"><span className="logo-cine">Cine</span><span className="logo-plus">Plus</span></div>
          </NavLink>
        </div>
        <nav className="main-nav">
          <ul>
            <li><NavLink to="/cartelera" className={({ isActive }) => isActive ? 'active' : ''}>Cartelera</NavLink></li>
            <li><NavLink to="/cines" className={({ isActive }) => isActive ? 'active' : ''}>Cines</NavLink></li>
            <li><NavLink to="/promociones" className={({ isActive }) => isActive ? 'active' : ''}>Promociones</NavLink></li>
            <li><NavLink to="/dulceria" className={({ isActive }) => isActive ? 'active' : ''}>Dulcería</NavLink></li>
          </ul>
        </nav>
        <div className="navbar-right">
          <button className="cinema-selector" onClick={handleOpenModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C19.0518 4.32387 21 7.61305 21 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{selectedCinema ? selectedCinema.name : 'ELEGIR CINE'}</span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 6L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <Link to="/perfil" className="icon-user" aria-label="Perfil usuario">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {username && <span className="username">{username}</span>}
          </Link>
        </div>
      </div>
      
      <SideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Seleccionar Cine"
      >
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            <div className="cinema-list">
              {cinemas.map((cinema) => (
                <div
                  key={cinema.id}
                  className={`cinema-item ${selectedCinema?.id === cinema.id ? 'selected' : ''}`}
                  onClick={() => handleSelectCinema(cinema)}
                >
                  <span className="cinema-name">{cinema.name}</span>
                </div>
              ))}
            </div>
            <div className="cinema-apply-container">
              <button className="cinema-apply-btn" onClick={handleApply}>
                APLICAR
              </button>
            </div>
          </>
        )}
      </SideModal>
    </header>
  );
};

export default Navbar;