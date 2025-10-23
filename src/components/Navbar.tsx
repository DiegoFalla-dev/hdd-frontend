import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
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
        <button className="icon-user">👤</button>
      </div>
    </header>
  );
};

export default Navbar;
