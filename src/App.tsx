import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Cartelera from './pages/Cartelera'
import Cines from './pages/Cines'
import Dulceria from './pages/Dulceria'
import DetallePelicula from './pages/DetallePelicula'
import Confirmacion from './pages/Confirmacion'
import CarritoEntradas from './pages/CarritoEntradas'
import Butacas from './pages/Butacas'
import CarritoDulceria from './pages/CarritoDulceria'
import CarritoTotal from './pages/CarritoTotal'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Placeholder components for routes we haven't implemented yet
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <>
    <Navbar />
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <h1 className="text-2xl">Página de {title} - Próximamente</h1>
    </div>
    <Footer />
  </>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cartelera" element={<Cartelera />} />
        <Route path="/cines" element={<Cines />} />
        <Route path="/detalle-pelicula" element={<DetallePelicula />} />
  <Route path="/confirmacion" element={<Confirmacion />} />
  <Route path="/carrito-entradas" element={<CarritoEntradas />} />
    <Route path="/butacas" element={<Butacas />} />
  <Route path="/dulceria-carrito" element={<CarritoDulceria />} />
  <Route path="/pago" element={<CarritoTotal />} />
        <Route path="/promociones" element={<PlaceholderPage title="Promociones" />} />
        <Route path="/dulceria" element={<Dulceria />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
