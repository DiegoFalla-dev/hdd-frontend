import React from 'react';
import './HomePage.css'; // Puedes crear este archivo para estilos personalizados
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  return (
    <div className="cineplus-home">
      <Navbar />

      {/* Banner/Carrusel principal */}
      <section className="main-banner">
        {/* Aquí irá el carrusel de imágenes/promociones */}
        <div className="banner-placeholder">Banner principal</div>
      </section>

      {/* Filtros de búsqueda */}
      <section className="filters-section">
        <form className="filters-form">
          <select name="pelicula">
            <option>Por película</option>
          </select>
          <select name="ciudad">
            <option>Por ciudad</option>
          </select>
          <select name="cine">
            <option>Por cine/localidad</option>
          </select>
          <select name="fecha">
            <option>Por fecha</option>
          </select>
          <button type="submit">Filtrar</button>
        </form>
      </section>

      {/* Sección de películas */}
      <main className="movies-section">
        <h2>Películas</h2>
        <nav className="movies-nav">
          <span>En cartelera</span>
          <span>Preventa</span>
          <span>Próximos estrenos</span>
        </nav>
        <div className="movies-list">
          {/* Aquí irán los posters de las películas */}
          <div className="movie-poster">Poster 1</div>
          <div className="movie-poster">Poster 2</div>
          <div className="movie-poster">Poster 3</div>
        </div>
        <aside className="see-more-movies">Ver más películas</aside>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
