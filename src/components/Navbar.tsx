import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [usuario, setUsuario] = useState<{ username?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (stored) setUsuario(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    navigate('/');
  };

  return (
    <header className="cineplus-header">
      <NavLink to="/" className="logo">CinePlus</NavLink>
      <nav className="main-nav">
        <ul>
          <li><NavLink to="/cartelera" className={({ isActive }) => isActive ? 'active' : ''}>Cartelera</NavLink></li>
          <li><NavLink to="/cines" className={({ isActive }) => isActive ? 'active' : ''}>Cines</NavLink></li>
          <li><NavLink to="/promociones" className={({ isActive }) => isActive ? 'active' : ''}>Promociones</NavLink></li>
          <li><NavLink to="/dulceria" className={({ isActive }) => isActive ? 'active' : ''}>Dulcería</NavLink></li>
        </ul>
      </nav>
      <div className="user-actions">
        <span className="location">Cineplus Asia</span>
        {usuario ? (
          <div className="profile-actions">
            <button className="icon-user" onClick={() => navigate('/perfil')}>👤 {usuario.username}</button>
            <button className="logout" onClick={handleLogout}>Salir</button>
          </div>
        ) : (
          <button className="icon-user" onClick={() => navigate('/perfil')}>Iniciar</button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
