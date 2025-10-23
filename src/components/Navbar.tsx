import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';
import authService from '../services/authService';
import SideModal from './SideModal'; // Asume que este componente exista
import ProfilePanel from './ProfilePanel';
import { FaUser, FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa';
import { getAllCinemas } from '../services/cinemaService'; // Asume que este servicio existe
import type { Cinema } from '../types/Cinema'; // Asume que este tipo existe

type NavbarProps = {
  variant?: string;
  heroHeight?: number;
};

const Navbar: React.FC<NavbarProps> = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Lógica para obtener el usuario actual
    const u = authService.getCurrentUser();
    setUsername(u?.username ?? null);
    const onStorage = () => setUsername(authService.getCurrentUser()?.username ?? null);
    const onLogout = () => { setUsername(null); setIsProfileOpen(false); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:logout', onLogout);
    
    // Lógica para cargar el cine seleccionado del localStorage
    const savedCinema = localStorage.getItem('selectedCine');
    if (savedCinema) {
      setSelectedCinema(JSON.parse(savedCinema));
    }
    
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('auth:logout', onLogout); };
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
      localStorage.setItem('selectedCine', JSON.stringify(selectedCinema));
    }
    setIsModalOpen(false);
    // Recargar la página para aplicar el cambio del cine seleccionado
    window.location.reload(); 
  };

  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className={`cineplus-header ${isScrolled ? 'scrolled' : 'transparent'} ${isHome ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white' : 'bg-white text-gray-800'}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <NavLink to="/" className={`logo-text flex items-center gap-2 ${isHome ? 'text-white' : ''}`}>
            <img src="https://i.imgur.com/K9o09F6.png" alt="Logo" className="logo-img" />
            <div className="logo-brand"><span className="logo-cine">Cine</span><span className="logo-plus">Plus</span></div>
          </NavLink>
        </div>
        <nav className={`main-nav ${isHome ? 'opacity-95' : ''}`}>
          <ul className="flex space-x-6">
            <li><NavLink to="/cartelera" className={({ isActive }) => isActive ? 'active font-semibold' : isHome ? 'text-white/90 hover:text-white' : ''}>Cartelera</NavLink></li>
            <li><NavLink to="/cines" className={({ isActive }) => isActive ? 'active font-semibold' : isHome ? 'text-white/90 hover:text-white' : ''}>Cines</NavLink></li>
            <li><NavLink to="/promociones" className={({ isActive }) => isActive ? 'active font-semibold' : isHome ? 'text-white/90 hover:text-white' : ''}>Promociones</NavLink></li>
            <li><NavLink to="/dulceria" className={({ isActive }) => isActive ? 'active font-semibold' : isHome ? 'text-white/90 hover:text-white' : ''}>Dulcería</NavLink></li>
          </ul>
        </nav>
        <div className="navbar-right">
          <button className={`cinema-selector ${isHome ? 'bg-white/20 text-white' : ''}`} onClick={handleOpenModal}>
            <FaMapMarkerAlt size={16} color="white" />
            <span>{selectedCinema ? selectedCinema.name : 'ELEGIR CINE'}</span>
            <FaChevronDown size={12} color="white" />
          </button>
          <button type="button" className="icon-user" aria-label="Perfil usuario" onClick={() => setIsProfileOpen(true)}>
            <FaUser size={20} color="white" />
          </button>
        </div>
      </div>
      
      <SideModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title={username ? 'Mi perfil' : 'Usuario'}
      >
        <ProfilePanel onClose={() => setIsProfileOpen(false)} />
      </SideModal>
      <SideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Seleccionar Cine"
        subtitle="Selecciona tu cine favorito"
        orderText="Ordenado alfabéticamente"
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