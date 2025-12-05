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
    const featured = allMovies.filter(m => m.status === 'NOW_PLAYING').slice(0, 5);
    return featured.length > 0 ? featured : allMovies.slice(0, 5);
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

  // Selección de imagen: primero bannerUrl, luego cardImageUrl, luego posterUrl/trailerUrl, y por último placeholder
  const getBannerImage = (m: Movie) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyM = m as any;
    return anyM.bannerUrl || anyM.cardImageUrl || m.posterUrl || m.trailerUrl || '/placeholder-banner.jpg';
  };

  return (
    <section className="relative w-full max-h-[600px] overflow-hidden">
      {isLoading ? (
        <div className="w-full h-[600px] flex items-center justify-center text-white">Cargando...</div>
      ) : (
        <Slider {...settings}>
          {movies.map((m) => (
            <figure key={m.id} className="relative w-full">
              <img
                src={getBannerImage(m)}
                alt={m.title}
                className="w-full h-[600px] object-cover"
              />
              <figcaption className="absolute bottom-4 left-4 text-white text-2xl font-bold drop-shadow-md">{m.title}</figcaption>
            </figure>
          ))}
        </Slider>
      )}
    </section>
  );
};

export default HeroBanner;