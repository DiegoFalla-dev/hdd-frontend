import React from "react";
import Slider from "react-slick";
import { ChevronRight, ChevronLeft } from "react-feather";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./HeroBanner.css";

const HeroBanner: React.FC = () => {
  const banners = [
    {
      id: 1,
      img: "https://static.cinepolis.com/img/front/11/202591893036993-prin.png",
      alt: "Tony, Shelly y la lámpara mágica",
    },
    {
      id: 2,
      img: "https://static.cinepolis.com/img/front/11/202591892855333-prin.jpg",
      alt: "Camina o muere",
    },
    {
      id: 3,
      img: "https://static.cinepolis.com/img/front/11/202591892614663-prin.jpg",
      alt: "Patas",
    },
    {
      id: 4,
      img: "https://static.cinepolis.com/img/front/11/2025918142614944-prin.png",
      alt: "El gran viaje de tu vida",
    },
    {
      id: 5,
      img: "https://static.cinepolis.com/img/front/11/2025822105333944-prin.jpg",
      alt: "Otro viernes de locos",
    },
  ];

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

  return (
    <section className="relative w-full max-h-[600px] overflow-hidden">
      <Slider {...settings}>
        {banners.map((banner) => (
          <figure key={banner.id} className="relative w-full">
            <img
              src={banner.img}
              alt={banner.alt}
              className="w-full h-[600px] object-cover"
            />
          </figure>
        ))}
      </Slider>
    </section>
  );
};

export default HeroBanner;