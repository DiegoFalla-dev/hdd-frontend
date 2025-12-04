import React from 'react';
import './HomePage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroBanner from '../components/HeroBanner';
import FilterBar from '../components/FilterBar';
import MovieCarousel from '../components/MovieCarousel';

const HomePage: React.FC = () => {
  return (
    <div className="cineplus-home">
      <Navbar variant="dark" heroHeight={600} />
      
      <HeroBanner />
      
      <section className="bg-transparent py-8">
        <FilterBar />
      </section>

      <MovieCarousel />
      
      <div className="py-32"></div>

      <Footer />
    </div>
  );
};

export default HomePage;
