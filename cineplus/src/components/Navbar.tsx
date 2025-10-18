import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiUser, FiSearch, FiHelpCircle, FiMapPin, FiChevronDown, FiX } from "react-icons/fi";

const navLinks = [
  { label: "Cartelera", to: "/cartelera" },
  { label: "Cines", to: "/cines" },
  { label: "Promociones", to: "/promociones" },
  { label: "Dulcería", to: "/dulceria" },
];


interface NavbarProps {
  heroHeight?: number;
  variant?: 'landing' | 'boletos';
}

const cines = [
  "Cineplus Asia",
  "Cineplus Gamarra", 
  "Cineplus Jockey Plaza",
  "Cineplus Lambramani",
  "Cineplus Mall Ave Pza Arequipa",
  "Cineplus MallPlaza Angamos",
  "Cineplus Mallplaza Bellavista",
];

const Navbar: React.FC<NavbarProps> = ({ heroHeight = 620, variant = 'landing' }) => {
  const [atTop, setAtTop] = useState(true);
  const [logoHover, setLogoHover] = useState(false);
  const [beyondHero, setBeyondHero] = useState(false);
  const [showCineModal, setShowCineModal] = useState(false);
  const [selectedCine, setSelectedCine] = useState<string | null>(null);

  useEffect(() => {
    const savedCine = localStorage.getItem("selectedCine");
    if (savedCine) {
      setSelectedCine(savedCine);
    }
  }, []);

  const handleCineSelection = (cine: string) => {
    setSelectedCine(cine);
    localStorage.setItem("selectedCine", cine);
    setShowCineModal(false);
    window.location.reload();
  };

  useEffect(() => {
    const handleScroll = () => {
      setAtTop(window.scrollY < 10);
      setBeyondHero(window.scrollY > heroHeight - 60); // 60px: navbar height approx
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroHeight]);

  // Estilos condicionales por variante
  let headerClass = "w-full z-100 transition-all duration-300 ";
  let headerStyle: React.CSSProperties = {};
  let logoSrc = beyondHero || logoHover ? "/public/logo-black.png" : "/public/logo-white.png";
  if (variant === 'landing') {
    headerClass += 'fixed left-0 top-0 ';
    headerClass += beyondHero
      ? "bg-[var(--cineplus-black)] border-b border-[var(--cineplus-gray-medium)] navbar-shadow-dark"
      : atTop
        ? "bg-transparent color-[var(--cineplus-black)] shadow-none"
        : "bg-[var(--cineplus-black)] border-[var(--cineplus-gray-medium)] navbar-shadow-dark";
    headerStyle = beyondHero ? { background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)", backdropFilter: "none" } : atTop ? { background: "transparent", color: "var(--cineplus-gray-light)", backdropFilter: "none" } : { background: "transparent", color: "var(--cineplus-gray-light)", backdropFilter: "blur(0px)" };
  } else if (variant === 'boletos') {
    // Estático, no fixed
    headerClass += "bg-[var(--cineplus-gray-light)] border-b border-[var(--cineplus-gray)] shadow-sm";
    headerStyle = { background: "var(--cineplus-gray-light)", color: "var(--cineplus-black)", boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)" };
    logoSrc = "/public/logo-black.png";
  }

  return (
    <header
      className={headerClass}
      style={headerStyle}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group cursor-pointer select-none"
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
          >
            <img
              src={logoSrc}
              alt="CinePlus Logo"
              className="h-9 w-9 transition"
            />
            <span className="font-extrabold text-xl tracking-wide">
              <span style={{ color: "var(--cineplus-gray-light)" }}>Cine</span><span style={{ color: "var(--cineplus-gray)" }}>Plus</span>
            </span>
          </Link>
        {/* Links */}
        <nav className="flex-1 flex justify-center">
          <ul className="flex gap-6 text-base font-medium">
            {navLinks.map((link) => (
              <li key={link.label} className="relative group">
                <Link
                  to={link.to}
                  style={beyondHero ? {color: "var(--cineplus-gray-light)", backdropFilter: "none"} : atTop ? { background: "transparent", color: "var(--cineplus-gray-light)"} : { background: "transparent", color: "var(--cineplus-gray-light)"}}
                  className="transition-all duration-300 hover:text-[var(--cineplus-gray)] group-hover:text-[var(--cineplus-gray)] peer"
                >
                  <span className="relative inline-block">
                    {link.label}
                    {/* Subrayado animado solo en hover */}
                    <span className="block absolute left-0 -bottom-1 w-full h-1 rounded bg-[var(--cineplus-gray)] opacity-0 peer-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Iconos */}
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setShowCineModal(true)}
            data-elegir-cine
            className="flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:text-[var(--cineplus-gray)]" 
            style={{ color: "var(--cineplus-gray-light)" }}
          >
            <FiMapPin size={16} />
            <span>{selectedCine || "ELEGIR CINE"}</span>
            <FiChevronDown size={14} />
          </button>
          <Link to="/perfil" title="Usuario" style={{ color: "var(--cineplus-gray-light)" }} className="hover:text-[var(--cineplus-gray)] transition-all duration-300">
            <FiUser size={26} />
          </Link>
          <Link to="/atencion" title="Ayuda" style={{ color: "var(--cineplus-gray-light)" }} className="relative hover:text-[var(--cineplus-gray)] transition-all duration-300">
            <FiHelpCircle size={26} />
          </Link>
        </div>
      </div>

      {/* Modal de selección de cine */}
      {showCineModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCineModal(false)}
          />
          <div className="fixed top-0 right-0 h-full w-96 bg-black z-50 shadow-xl" style={{ background: "var(--cineplus-black)" }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: "var(--cineplus-gray-light)" }}>Elige tu cine</h2>
                <button 
                  onClick={() => setShowCineModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--cineplus-gray)" }}>Selecciona tu cine favorito</h3>
                <p className="text-xs mb-4" style={{ color: "var(--cineplus-gray)" }}>Ordenado alfabéticamente</p>
              </div>

              <div className="space-y-3">
                {cines.map((cine) => (
                  <div 
                    key={cine}
                    onClick={() => handleCineSelection(cine)}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-800"
                    style={{ 
                      backgroundColor: selectedCine === cine ? "var(--cineplus-gray-dark)" : "transparent",
                      border: `1px solid ${selectedCine === cine ? "var(--cineplus-gray)" : "var(--cineplus-gray-dark)"}` 
                    }}
                  >
                    <div>
                      <h4 className="font-medium" style={{ color: "var(--cineplus-gray-light)" }}>{cine}</h4>
                      <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>2D</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2" style={{ 
                      borderColor: selectedCine === cine ? "var(--cineplus-gray-light)" : "var(--cineplus-gray)",
                      backgroundColor: selectedCine === cine ? "var(--cineplus-gray-light)" : "transparent"
                    }} />
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowCineModal(false)}
                className="w-full mt-6 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                APLICAR
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;