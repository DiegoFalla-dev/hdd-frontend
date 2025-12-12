import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import Cartelera from './pages/Cartelera'
import Cines from './pages/Cines'
import Dulceria from './pages/Dulceria'
import Promociones from './pages/Promociones'
import DetallePelicula from './pages/DetallePelicula'
import Confirmacion from './pages/Confirmacion'
import PaymentMethodsPage from './pages/PaymentMethodsPage'
import ProfileEditPage from './pages/ProfileEditPage'
import CarritoEntradas from './pages/CarritoEntradas'
import Butacas from './pages/Butacas'
import CarritoDulceria from './pages/CarritoDulceria'
import CarritoTotal from './pages/CarritoTotal'
import OrdersPage from './pages/OrdersPage'
// import Navbar from './components/Navbar' // Comentado: se usa en PlaceholderPage comentado
// import Footer from './components/Footer' // Comentado: se usa en PlaceholderPage comentado
import StaffDashboard from './pages/Staff/StaffDashboard';
import MoviesAdmin from './pages/Staff/MoviesAdmin';
import TheatersAdmin from './pages/Staff/TheatersAdmin';
import ShowtimesAdmin from './pages/Staff/ShowtimesAdmin';
import UsersAdmin from './pages/Staff/UsersAdmin';
import PromotionsAdmin from './pages/Staff/PromotionsAdmin'

// Placeholder components for routes we haven't implemented yet
// Comentado: no se usa en ninguna ruta
// const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
//   <>
//     <Navbar />
//     <div className="min-h-screen bg-black text-white flex items-center justify-center">
//       <h1 className="text-2xl">Página de {title} - Próximamente</h1>
//     </div>
//     <Footer />
//   </>
// );

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cartelera" element={<Cartelera />} />
        <Route path="/cines" element={<Cines />} />
        <Route path="/detalle-pelicula" element={<DetallePelicula />} />
        <Route path="/confirmacion/:orderId" element={<ProtectedRoute><Confirmacion /></ProtectedRoute>} />
        <Route path="/carrito-entradas" element={<ProtectedRoute><CarritoEntradas /></ProtectedRoute>} />
        {/* Incluimos showtimeId como parámetro obligatorio para alinear con flujo backend */}
        <Route path="/butacas/:showtimeId" element={<ProtectedRoute><Butacas /></ProtectedRoute>} />
        <Route path="/dulceria-carrito" element={<ProtectedRoute><CarritoDulceria /></ProtectedRoute>} />
        <Route path="/pago" element={<ProtectedRoute><CarritoTotal /></ProtectedRoute>} />
        <Route path="/mis-compras" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        {/* Comentado: PlaceholderPage no implementada */}
        <Route path="/promociones" element={<Promociones />} />
        <Route path="/dulceria" element={<Dulceria />} />
        <Route path="/metodos-pago" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/movies" element={<MoviesAdmin />} />
        <Route path="/staff/theaters" element={<TheatersAdmin />} />
        <Route path="/staff/showtimes" element={<ShowtimesAdmin />} />
        <Route path="/staff/users" element={<UsersAdmin />} />
        <Route path="/staff/promotions" element={<PromotionsAdmin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
