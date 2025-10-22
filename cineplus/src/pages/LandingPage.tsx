// cineplus/src/pages/LandingPage.tsx
import React from "react";
import Navbar from "../components/Navbar";
import HeroBanner from "../components/HeroBanner";
import FilterBar from "../components/FilterBar"; 
import MovieCarousel from "../components/MovieCarousel";
import Footer from "../components/Footer";

const LandingPage: React.FC = () => {
  return (
  <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen flex flex-col">
      <Navbar />
      <HeroBanner />

      {/* Contenedor central para FilterBar y MovieCarousel */}
      <div className="max-w-6xl w-full mx-auto">
        <div className="mt-20
        "> {/* <-- Espacio superior para separar del HeroBanner */}
          <FilterBar />
        </div>
        <section className="mt-8">
          <MovieCarousel />
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default LandingPage;

