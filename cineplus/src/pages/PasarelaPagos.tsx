import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiX, FiCreditCard } from "react-icons/fi";
import { peliculas } from "../data/peliculas";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface Entrada {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface ProductoCarrito {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

const PasarelaPagos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [movieSelection, setMovieSelection] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [carritoProductos, setCarritoProductos] = useState<ProductoCarrito[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'yape'>('tarjeta');
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [needsReceipt, setNeedsReceipt] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const peliculaId = searchParams.get('pelicula');
  const day = searchParams.get('day');
  const time = searchParams.get('time');
  const format = searchParams.get('format');
  
  const pelicula = peliculas.find(p => p.id === peliculaId);
  const totalEntradas = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);
  const totalProductos = carritoProductos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const subtotal = totalEntradas + totalProductos;
  const cargoServicio = 0.80;
  const totalGeneral = subtotal + cargoServicio;

  useEffect(() => {
    const savedCine = localStorage.getItem("selectedCine");
    const savedSelection = localStorage.getItem("movieSelection");
    const savedEntradas = localStorage.getItem("selectedEntradas");
    const savedSeats = localStorage.getItem("selectedSeats");
    const savedProductos = localStorage.getItem("carritoProductos");
    
    if (savedCine) setSelectedCine(savedCine);
    if (savedSelection) setMovieSelection(JSON.parse(savedSelection));
    if (savedEntradas) setEntradas(JSON.parse(savedEntradas));
    if (savedSeats) setSelectedSeats(JSON.parse(savedSeats));
    if (savedProductos) setCarritoProductos(JSON.parse(savedProductos));
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  const generatePDF = async () => {
    const pdf = new jsPDF();
    const currentDate = new Date().toLocaleDateString('es-PE');
    const currentTime = new Date().toLocaleTimeString('es-PE');
    const ticketNumber = `${Date.now()}-1`;
    
    // Datos para el QR
    const qrData = {
      pelicula: (movieSelection?.pelicula || pelicula)?.titulo,
      cine: movieSelection?.selectedCine || selectedCine,
      sala: "Sala 6",
      asientos: selectedSeats.join(', '),
      fecha: formatDate((movieSelection?.selectedDay || day) || ''),
      hora: movieSelection?.selectedTime || time,
      formato: movieSelection?.selectedFormat || format,
      ticket: ticketNumber
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
    
    // Header con logo
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CINEPLUS', 20, 25);
    
    // QR Code en la esquina superior derecha
    pdf.addImage(qrCodeDataURL, 'PNG', 150, 15, 40, 40);
    
    // Número de ticket
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`N# ${ticketNumber}`, 20, 35);
    pdf.text(`Fecha de compra:`, 20, 42);
    pdf.text(`${currentDate} ${currentTime}`, 20, 49);
    
    // Línea separadora
    pdf.line(20, 60, 190, 60);
    
    // Título de la película
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text((movieSelection?.pelicula || pelicula)?.titulo || '', 20, 75);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`(${movieSelection?.selectedFormat || format} - Doblada)`, 20, 82);
    
    // Información del cine y función
    let yPos = 95;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Lugar:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(movieSelection?.selectedCine || selectedCine || '', 45, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fecha:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${formatDate((movieSelection?.selectedDay || day) || '')} ${movieSelection?.selectedTime || time}`, 45, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sala:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sala 6', 45, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Asientos:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(selectedSeats.join(', '), 55, yPos);
    
    if (needsReceipt) {
      // Tabla de productos
      yPos += 20;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPos - 5, 170, 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Qty.', 25, yPos);
      pdf.text('Tipo', 100, yPos);
      pdf.text('Precio', 160, yPos);
      
      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      
      // Entradas
      entradas.forEach(entrada => {
        pdf.text(entrada.cantidad.toString(), 25, yPos);
        pdf.text(entrada.nombre, 40, yPos);
        pdf.text(`S/ ${(entrada.precio * entrada.cantidad).toFixed(2)}`, 160, yPos);
        yPos += 7;
      });
      
      // Productos de dulcería
      carritoProductos.forEach(producto => {
        pdf.text(producto.cantidad.toString(), 25, yPos);
        pdf.text(producto.nombre, 40, yPos);
        pdf.text(`S/ ${(producto.precio * producto.cantidad).toFixed(2)}`, 160, yPos);
        yPos += 7;
      });
      
      // Cargo por servicio
      if (cargoServicio > 0) {
        pdf.text('', 25, yPos);
        pdf.text('Comisión online', 40, yPos);
        pdf.text(`S/ ${cargoServicio.toFixed(2)}`, 160, yPos);
        yPos += 10;
      }
      
      // Total
      pdf.line(140, yPos, 180, yPos);
      yPos += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total', 140, yPos);
      pdf.text(`S/ ${totalGeneral.toFixed(2)}`, 160, yPos);
    }
    
    // Footer con términos
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const footerY = 250;
    pdf.text('1. Esta entrada es tu comprobante de pago y contiene el precio cobrado por el cine.', 20, footerY);
    pdf.text('2. No existe ningún tipo de cambio una vez realizada la compra.', 20, footerY + 5);
    pdf.text('3. El cine se reserva el derecho de solicitar el documento de identidad al portador.', 20, footerY + 10);
    pdf.text('4. Escanea el código QR para ingresar a la sala.', 20, footerY + 15);
    
    pdf.save(`cineplus-entrada-${ticketNumber}.pdf`);
  };

  const handlePayment = async () => {
    if (paymentMethod === 'tarjeta' && (!cardNumber || !cardHolder || !expiryDate || !cvv)) {
      alert('Por favor completa todos los campos de la tarjeta');
      return;
    }
    if (!acceptTerms) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }
    
    await generatePDF();
    alert('¡Pago realizado con éxito! Tu entrada ha sido descargada.');
  };

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--cineplus-gray-dark)" }}>
        <h1 className="text-xl font-bold">Pago</h1>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => window.history.back()}
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="flex justify-center">
        {/* Contenido principal */}
        <div className="flex-1 p-8 max-w-2xl">
          <h2 className="text-2xl font-bold mb-6">PAGO</h2>
          
          {/* Selección método de pago */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">SELECCIONAR MÉTODO DE PAGO</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setPaymentMethod('tarjeta')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'tarjeta' 
                    ? 'border-white bg-white text-black' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <FiCreditCard size={20} />
                <span className="font-semibold">Tarjeta</span>
              </button>
              <button
                onClick={() => setPaymentMethod('yape')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'yape' 
                    ? 'border-purple-500 bg-purple-500 text-white' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="w-5 h-5 bg-purple-600 rounded"></div>
                <span className="font-semibold">Yape</span>
              </button>
            </div>
          </div>

          {/* Información de pago */}
          {paymentMethod === 'tarjeta' && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">INFORMACIÓN DE PAGO</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nº de tarjeta de crédito o débito"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Titular de la tarjeta"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Fecha de expiración"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* Necesito boleta */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={needsReceipt}
                onChange={(e) => setNeedsReceipt(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-bold">NECESITO BOLETA DE VENTA CON DATOS</span>
            </label>
          </div>

          {/* Términos y condiciones */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">TÉRMINOS Y CONDICIONES</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <span className="text-sm">
                He revisado la orden de compra, leído y acepto la política de manejo de datos y los{' '}
                <a href="#" className="text-blue-400 underline">Términos y Condiciones</a>
              </span>
            </label>
          </div>

          {/* Información de compra */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">INFORMACIÓN DE TU COMPRA</h3>
            <div className="text-sm space-y-2">
              <p>Te recomendamos llegar 20 minutos antes de iniciar la función.</p>
              <p>Respeta tu ubicación dentro de la sala.</p>
              <p>Si has comprado un paquete de entradas que incluye productos de confitería, ve a la confitería para canjear tu compra, antes de ingresar a la sala.</p>
            </div>
          </div>
        </div>

        {/* Panel lateral derecho - Resumen */}
        <div className="w-80 p-6 border-l" style={{ borderColor: "var(--cineplus-gray-dark)", background: "var(--cineplus-gray-dark)" }}>
          <h3 className="text-lg font-bold mb-6">RESUMEN</h3>
          
          {/* Información de la película */}
          {(movieSelection?.pelicula || pelicula) && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Película</h4>
              <div className="flex gap-3">
                <img 
                  src={(movieSelection?.pelicula || pelicula)?.imagenCard} 
                  alt={(movieSelection?.pelicula || pelicula)?.titulo}
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <h5 className="font-medium text-sm">{(movieSelection?.pelicula || pelicula)?.titulo.toUpperCase()}</h5>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>{movieSelection?.selectedFormat || format} - Doblada</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del cine y horario */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Cine, día y horario</h4>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-600 rounded flex-shrink-0 mt-1"></div>
              <div>
                <h5 className="font-medium text-sm">{movieSelection?.selectedCine || selectedCine}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Sala 6</p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {formatDate((movieSelection?.selectedDay || day) || '')} - {movieSelection?.selectedTime || time}
                </p>
              </div>
            </div>
          </div>

          {/* Productos de dulcería */}
          {carritoProductos.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Alimentos y Bebidas</h4>
              <div className="space-y-3">
                {carritoProductos.map((producto) => (
                  <div key={producto.id} className="flex items-center gap-2">
                    <img src="/4x3.png" alt={producto.nombre} className="w-8 h-8 object-cover rounded" />
                    <div>
                      <div className="text-sm font-medium">{producto.cantidad} - {producto.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>S/ {producto.precio.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Cargo por servicio confitería</div>
                    <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>S/ {cargoServicio.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de entradas */}
          {entradas.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Entradas</h4>
              <div className="space-y-3">
                {entradas.map((entrada) => (
                  <div key={entrada.id} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white rounded"></div>
                    <div>
                      <div className="text-sm font-medium">{entrada.cantidad} - {entrada.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>S/ {entrada.precio.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Cargo por servicio online</div>
                    <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Incluye el cargo por servicio online</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Asientos seleccionados */}
          {selectedSeats.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Asientos</h4>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div>
                  <div className="text-sm font-medium">{selectedSeats.join(', ')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Subtotal */}
          <div className="mb-6 pt-4 border-t border-gray-600">
            <div className="flex justify-between items-center">
              <span className="font-bold">SUBTOTAL</span>
              <span className="font-bold">S/ {subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Total y botón continuar */}
          <div className="mt-auto">
            <div 
              className="p-4 rounded flex items-center justify-between bg-white text-black cursor-pointer"
              onClick={handlePayment}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black rounded"></div>
                <span className="font-bold">S/ {totalGeneral.toFixed(2)}</span>
              </div>
              <span className="font-bold">
                CONTINUAR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasarelaPagos;
