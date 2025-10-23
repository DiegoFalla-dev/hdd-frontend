import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Cartelera from './pages/Cartelera'
import Cines from './pages/Cines'
import Dulceria from './pages/Dulceria'
import DetallePelicula from './pages/DetallePelicula'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PerfilUsuario from './pages/PerfilUsuario'

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
        <Route path="/promociones" element={<PlaceholderPage title="Promociones" />} />
        <Route path="/dulceria" element={<Dulceria />} />
        <Route path="/perfil" element={<PerfilUsuario />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
