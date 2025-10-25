import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import authService from '../services/authService';

const CarritoTotal: React.FC = () => {
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [movieSelection, setMovieSelection] = useState<any>(null);
  const [selectedCine, setSelectedCine] = useState<any>(null);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const [carritoProductos, setCarritoProductos] = useState<any[]>([]);

  useEffect(() => {
    const ms = localStorage.getItem('movieSelection');
    const cine = localStorage.getItem('selectedCine');
    const ent = localStorage.getItem('selectedEntradas');
    const s = localStorage.getItem('selectedSeats');
    const cp = localStorage.getItem('carritoProductos');
    setMovieSelection(ms ? JSON.parse(ms) : null);
    setSelectedCine(cine ? JSON.parse(cine) : null);
    setEntradas(ent ? JSON.parse(ent) : []);
    setSeats(s ? JSON.parse(s) : []);
    setCarritoProductos(cp ? JSON.parse(cp) : []);
  }, []);

  const calcTotal = () => {
    const entradasTotal = entradas.reduce((acc: number, e: any) => acc + (e.precio || 0) * (e.cantidad || 0), 0);
    const productosTotal = carritoProductos.reduce((acc: number, p: any) => acc + (p.precio || 0) * (p.cantidad || 0), 0);
    return entradasTotal + productosTotal;
  };

  const validateCard = () => {
    // Validación menos estricta:
    // - número de tarjeta: 12 a 19 dígitos (se permiten espacios/guiones en el input)
    // - CVV: 3 dígitos
    // - expiry: opcional; si se proporciona debe ser MM/YY ó MM/YYYY
    // - DNI: opcional (si se proporciona, mínimo 4 caracteres)
    const cc = cardNumber.replace(/\D/g, '');
    if (cc.length < 12 || cc.length > 19) return false;
    if (cvv && !/^[0-9]{3}$/.test(cvv)) return false;
    if (expiry && expiry.trim() !== '') {
      if (!/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(expiry)) return false;
    }
    if (dni && dni.trim() !== '' && dni.trim().length < 4) return false;
    return true;
  };

  const generateTicketPDF = async (purchaseId: string) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    pdf.setFontSize(14);
    pdf.text('CINEPLUS - COMPROBANTE DE PAGO', 40, 50);
    pdf.setFontSize(11);
    const fecha = new Date().toLocaleString();
    pdf.text(`Fecha: ${fecha}`, 40, 80);
    pdf.text(`Comprador: ${cardName || 'N/D'}`, 40, 100);
    pdf.text(`DNI: ${dni || 'N/D'}`, 40, 120);

    if (movieSelection) {
      pdf.text(`Película: ${movieSelection.titulo || movieSelection.title || 'N/D'}`, 40, 150);
    }
    if (selectedCine) {
      pdf.text(`Cine: ${selectedCine.name || selectedCine.nombre || 'N/D'}`, 40, 170);
    }

    // Entradas
    pdf.text('Entradas:', 40, 200);
    let y = 220;
    entradas.forEach((en: any) => {
      pdf.text(`${en.descripcion || en.tipo || 'Entrada'} x ${en.cantidad} = S/ ${(en.precio * en.cantidad).toFixed(2)}`, 50, y);
      y += 16;
    });

    // Asientos
    if (seats && seats.length > 0) {
      y += 6;
      pdf.text('Asientos:', 40, y);
      y += 16;
      seats.forEach((s: any) => {
        pdf.text(`${s.fila || s.row}${s.numero || s.col || ''}`, 50, y);
        y += 14;
      });
    }

    // Productos
    if (carritoProductos && carritoProductos.length > 0) {
      y += 8;
      pdf.text('Productos:', 40, y);
      y += 16;
      carritoProductos.forEach((p: any) => {
        pdf.text(`${p.name || p.nombre} x ${p.cantidad} = S/ ${(p.precio * p.cantidad).toFixed(2)}`, 50, y);
        y += 14;
      });
    }

    y += 20;
    pdf.setFontSize(13);
    pdf.text(`TOTAL: S/ ${calcTotal().toFixed(2)}`, 40, y);

    // QR
    const qrPayload = JSON.stringify({ purchaseId, movie: movieSelection?.titulo, total: calcTotal() });
    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload);
      pdf.addImage(qrDataUrl, 'PNG', 400, 60, 150, 150);
    } catch (err) {
      console.error('Error generando QR', err);
    }

    const filename = `comprobante_${purchaseId}.pdf`;
    pdf.save(filename);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCard()) {
      alert('Por favor revisa los datos de pago.');
      return;
    }

    setIsProcessing(true);
    // Simular procesamiento
    setTimeout(async () => {
      const purchaseId = `ORD-${Date.now()}`;
      try {
        await generateTicketPDF(purchaseId);
      } catch (err) {
        console.error('Error generando PDF', err);
      }

      // Construir objeto de compra
      const compra = {
        id: purchaseId,
        date: new Date().toISOString(),
        buyer: { dni, name: cardName },
        movie: movieSelection,
        cine: selectedCine,
        entradas,
        seats,
        productos: carritoProductos,
        total: calcTotal(),
      };

      // Adjuntar a usuario si está logueado, si no guardar como pendingPurchase
      const user = authService.getCurrentUser();
      if (user) {
        const existing = (user as any).purchases || [];
        const updated = { ...(user as any), purchases: [...existing, compra] };
        localStorage.setItem('usuario', JSON.stringify(updated));
      } else {
        localStorage.setItem('pendingPurchase', JSON.stringify(compra));
      }

      setIsProcessing(false);
      setSuccess(true);

      // Limpiar carrito local
      localStorage.removeItem('selectedEntradas');
      localStorage.removeItem('selectedSeats');
      localStorage.removeItem('carritoProductos');

      // Dar tiempo a mostrar éxito, luego redirigir a home y abrir modal de perfil/login
      setTimeout(() => {
        // Abrir modal de perfil para que el usuario vea la compra o inicie sesión
        window.dispatchEvent(new CustomEvent('openProfileModal'));
        navigate('/');
      }, 1200);
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded p-6">
        <h2 className="text-2xl font-semibold mb-4">Pago y Confirmación</h2>
        <div className="mb-6">
          <p className="text-sm text-gray-600">Por favor ingresa los datos de la tarjeta para procesar el pago.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">DNI</label>
            <input value={dni} onChange={(e) => setDni(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Número de tarjeta</label>
            <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="XXXX XXXX XXXX XXXX" className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Nombre en la tarjeta</label>
            <input value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">MM/AA</label>
              <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/AA" className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">CVV</label>
              <input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total a pagar</p>
                <p className="text-xl font-semibold">S/ {calcTotal().toFixed(2)}</p>
              </div>
              <button type="submit" disabled={isProcessing} className="bg-indigo-600 text-white px-4 py-2 rounded">
                {isProcessing ? 'Procesando...' : 'Pagar ahora'}
              </button>
            </div>
          </div>
        </form>

        {isProcessing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded p-6 text-center">
              <p className="mb-2">Procesando pago...</p>
              <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full mx-auto" />
            </div>
          </div>
        )}

        {success && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded p-6 text-center">
              <h3 className="text-lg font-semibold">Pago exitoso</h3>
              <p className="text-sm text-gray-600">Se ha generado y descargado tu comprobante.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarritoTotal;
