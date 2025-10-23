import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';
import userAuthService from '../services/userAuthService';

const Navbar: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const u = userAuthService.getStoredUser();
    setUsername(u?.username ?? null);
    const onStorage = () => setUsername(userAuthService.getStoredUser()?.username ?? null);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
        <Link to="/perfil" className="icon-user" aria-label="Perfil usuario">
          {username ? <span>👤 {username}</span> : <span>👤</span>}
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
