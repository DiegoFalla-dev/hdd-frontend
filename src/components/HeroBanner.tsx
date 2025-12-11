import React from "react";
import Slider from "react-slick";
import { ChevronRight, ChevronLeft } from "react-feather";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./HeroBanner.css";
import type { Movie } from '../types/Movie';
import { useAllMovies } from '../hooks/useMovies';

const HeroBanner: React.FC = () => {
  const { data: allMovies = [], isLoading } = useAllMovies();
  const movies: Movie[] = React.useMemo(() => {
    // Filtrar SOLO películas que tienen banner_url (no null)
    const moviesWithBanner = allMovies.filter(m => {
      const anyM = m as any;
      return anyM.bannerUrl != null && anyM.bannerUrl !== '';
    });
    return moviesWithBanner;
  }, [allMovies]);

  const NextArrow = ({ onClick }: any) => (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full z-10"
    >
      <ChevronRight size={28} />
    </button>
  );

  const PrevArrow = ({ onClick }: any) => (
    <button
      onClick={onClick}
      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full z-10"
    >
      <ChevronLeft size={28} />
    </button>
  );

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  // Usar SOLO banner_url (sin fallbacks)
  const getBannerImage = (m: Movie) => {
    const anyM = m as any;
    return anyM.bannerUrl;
  };

  // Si no hay películas con banner, no renderizar nada
  if (movies.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full h-[700px] overflow-hidden animate-fade-in">
      {isLoading ? (
        <div className="w-full h-[700px] flex items-center justify-center text-white">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-8 w-48 bg-gray-700 rounded"></div>
            <div className="h-4 w-32 bg-gray-600 rounded"></div>
          </div>
        </div>
      ) : (
        <Slider {...settings}>
          {movies.map((m) => (
            <figure key={m.id} className="relative w-full">
              {/* Imagen con overlay de degradado */}
              <div className="relative img-hover-zoom">
                <img
                  src={getBannerImage(m)}
                  alt={m.title}
                  className="w-full h-[700px] object-cover"
                />
                {/* Overlay degradado elegante */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141113] via-[#141113]/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#141113]/80 via-transparent to-transparent"></div>
              </div>
              
              {/* Título con animación y sombra mejorada */}
              <figcaption className="absolute bottom-12 left-12 animate-slide-up max-w-2xl">
                <h2 className="text-5xl md:text-6xl font-black text-white drop-shadow-2xl mb-3 tracking-tight">
                  {m.title}
                </h2>
                {(m as any).genre && (
                  <div className="flex gap-2 items-center mb-3">
                    <span className="badge-gradient-red">
                      {(m as any).genre}
                    </span>
                    {(m as any).duration && (
                      <span className="text-gray-300 text-sm font-semibold">
                        {(m as any).duration} 
                      </span>
                    )}
                  </div>
                )}
                {(m as any).synopsis && (
                  <p className="text-gray-200 text-sm md:text-base leading-relaxed line-clamp-3 max-w-xl drop-shadow-lg">
                    {(m as any).synopsis.length > 180 
                      ? `${(m as any).synopsis.substring(0, 180)}...` 
                      : (m as any).synopsis
                    }
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </Slider>
      )}
    </section>
  );
};

export default HeroBanner;