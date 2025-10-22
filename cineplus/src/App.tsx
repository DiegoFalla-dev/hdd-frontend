import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import LandingPage from "./pages/LandingPage";
import Cartelera from "./pages/Cartelera";
import DetallePelicula from "./pages/DetallePelicula";
import SeleccionBoletos from "./pages/SeleccionBoletos";
import Carrito from "./pages/Carrito";
import Butacas from "./pages/Butacas";
import CarritoDulceria from "./pages/CarritoDulceria";
import PasarelaPagos from "./pages/PasarelaPagos";
import PerfilUsuario from "./pages/PerfilUsuario";
import AtencionCliente from "./pages/AtencionCliente";
import Dulceria from "./pages/Dulceria";
import Cines from "./pages/Cines";
import Promociones from "./pages/Promociones";

// 👉 Componente que fuerza scroll al inicio
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cartelera" element={<Cartelera />} />
        <Route path="/cines" element={<Cines />} />
        <Route path="/promociones" element={<Promociones />} />
        <Route path="/detalle" element={<DetallePelicula />} />
        <Route path="/boletos" element={<SeleccionBoletos />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/butacas" element={<Butacas />} />
        <Route path="/dulceria-carrito" element={<CarritoDulceria />} />
        <Route path="/pago" element={<PasarelaPagos />} />
        <Route path="/perfil" element={<PerfilUsuario />} />
        <Route path="/atencion" element={<AtencionCliente />} />
        <Route path="/dulceria" element={<Dulceria />} />
      </Routes>
    </>
  );
};

export default App;

