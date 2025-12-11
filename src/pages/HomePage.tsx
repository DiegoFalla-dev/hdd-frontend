import React, { useEffect } from 'react';
import './HomePage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroBanner from '../components/HeroBanner';
import FilterBar from '../components/FilterBar';
import MovieCarousel from '../components/MovieCarousel';
import { clearOrderStorage } from '../utils/storage';
import { useCartStore } from '../store/cartStore';
import { useSeatSelectionStore } from '../store/seatSelectionStore';

const HomePage: React.FC = () => {
  // Limpiar datos de orden previa al montar la página principal
  useEffect(() => {
    // Clear Zustand stores
    useCartStore.getState().clearCart();
    useCartStore.getState().clearPromotion();
    useSeatSelectionStore.getState().clearAll();
    
    // Clear localStorage
    clearOrderStorage();
  }, []);

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
