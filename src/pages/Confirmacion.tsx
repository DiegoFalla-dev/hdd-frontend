import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { FiX } from 'react-icons/fi';
import { useOrder } from '../hooks/useOrder';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { useToast } from '../components/ToastProvider';

const Confirmacion: React.FC = () => {
  const { orderId: orderIdParam } = useParams();
  const toast = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const numericId = orderIdParam ? parseInt(orderIdParam, 10) : undefined;
  const orderQuery = useOrder(numericId);

  if (!numericId) {
    return (
      <div style={{ background: 'var(--cineplus-black)', color: 'var(--cineplus-gray-light)' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">No se encontró ID de orden</h2>
          <p className="text-sm text-gray-400">Realiza una compra para ver la confirmación.</p>
        </div>
      </div>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <div style={{ background: 'var(--cineplus-black)', color: 'var(--cineplus-gray-light)' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center">
          <p>Cargando confirmación...</p>
        </div>
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div style={{ background: 'var(--cineplus-black)', color: 'var(--cineplus-gray-light)' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Error al cargar la orden</h2>
          <p className="text-sm text-gray-400">Intenta nuevamente más tarde.</p>
        </div>
      </div>
    );
  }

  const confirmation = orderQuery.data;
  // Generar QR desde orderNumber + total al montar datos
  useEffect(() => {
    if (!confirmation) return;
    const payload = JSON.stringify({ order: confirmation.orderNumber || confirmation.orderId, total: confirmation.grandTotal });
    QRCode.toDataURL(payload)
      .then(setQrDataUrl)
      .catch(() => toast.error('Error generando QR'));
  }, [confirmation, toast]);

  const generatePDF = async () => {
    if (!confirmation) return;
    setPdfGenerating(true);
    try {
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      pdf.setFontSize(15);
      pdf.text('CINEPLUS - COMPROBANTE', 40, 50);
      pdf.setFontSize(11);
      const fecha = confirmation.createdAt ? new Date(confirmation.createdAt).toLocaleString() : new Date().toLocaleString();
      pdf.text(`Fecha: ${fecha}`, 40, 72);
      pdf.text(`Orden: ${confirmation.orderNumber || confirmation.orderId}`, 40, 88);
      pdf.text(`Estado de pago: ${confirmation.paymentStatus}`, 40, 104);
      let y = 130;
      pdf.setFontSize(12);
      pdf.text('Entradas:', 40, y); y += 18;
      confirmation.seats.forEach(group => {
        pdf.text(`Showtime ${group.showtimeId}: ${group.seatCodes.join(', ')}`, 54, y); y += 16;
      });
      y += 10;
      pdf.text('Concesiones:', 40, y); y += 18;
      if (!confirmation.concessions.length) {
        pdf.text('Sin productos', 54, y); y += 16;
      } else {
        confirmation.concessions.forEach(c => {
          pdf.text(`${c.name} x ${c.quantity} = S/ ${c.total.toFixed(2)}`, 54, y); y += 16;
        });
      }
      y += 10;
      pdf.setFontSize(12);
      pdf.text(`Subtotal Entradas: S/ ${confirmation.ticketsSubtotal.toFixed(2)}`, 40, y); y += 16;
      pdf.text(`Subtotal Concesiones: S/ ${confirmation.concessionsSubtotal.toFixed(2)}`, 40, y); y += 16;
      pdf.text(`Descuento: S/ ${confirmation.discountTotal.toFixed(2)}`, 40, y); y += 16;
      pdf.text(`TOTAL: S/ ${confirmation.grandTotal.toFixed(2)}`, 40, y); y += 24;
      if (confirmation.promotion) {
        pdf.setFontSize(10);
        pdf.text(`Promoción aplicada: ${confirmation.promotion.code}`, 40, y); y += 18;
      }
      if (qrDataUrl) {
        pdf.addImage(qrDataUrl, 'PNG', 400, 60, 140, 140);
      }
      pdf.save(`orden_${confirmation.orderNumber || confirmation.orderId}.pdf`);
      toast.success('PDF generado');
    } catch {
      toast.error('Error generando PDF');
    } finally {
      setPdfGenerating(false);
    }
  };
  const paymentStatus = confirmation.paymentStatus || 'PAID';
  const statusColor = paymentStatus === 'FAILED' ? 'bg-red-600' : paymentStatus === 'PENDING' ? 'bg-yellow-500' : 'bg-green-600';
  const statusLabel = paymentStatus === 'FAILED' ? 'Pago Fallido' : paymentStatus === 'PENDING' ? 'Pago Pendiente' : 'Pago Exitoso';

  return (
    <div style={{ background: 'var(--cineplus-black)', color: 'var(--cineplus-gray-light)' }} className="min-h-screen">
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'var(--cineplus-gray-dark)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Orden #{confirmation.orderNumber || confirmation.orderId}</h1>
          <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>{statusLabel}</span>
        </div>
        <button className="text-gray-400 hover:text-white" onClick={() => window.location.href = '/'}>
          <FiX size={24} />
        </button>
      </div>
      <div className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Detalle de Entradas</h2>
          {confirmation.seats.map(group => (
            <div key={group.showtimeId} className="mb-4 border border-gray-700 rounded p-3">
              <p className="text-xs text-gray-400">Showtime: {group.showtimeId}</p>
              <p className="text-sm">Asientos: {group.seatCodes.join(', ')}</p>
            </div>
          ))}
          <h2 className="text-lg font-semibold mt-6 mb-4">Concesiones</h2>
          {confirmation.concessions.length === 0 && <p className="text-sm text-gray-400">Sin productos</p>}
          {confirmation.concessions.map(c => (
            <div key={c.productId} className="mb-2 flex justify-between text-sm">
              <span>{c.name} x {c.quantity}</span>
              <span>S/ {c.total.toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-8 flex flex-col items-center gap-4">
            {qrDataUrl && (
              <div className="border border-gray-700 p-3 rounded bg-gray-800/40">
                <img src={qrDataUrl} alt="QR Orden" className="w-40 h-40" />
                <p className="text-xs text-gray-400 mt-2">Escanea para verificar compra</p>
              </div>
            )}
            <button
              onClick={generatePDF}
              disabled={pdfGenerating}
              className={"px-4 py-2 rounded text-sm font-semibold " + (pdfGenerating ? 'bg-gray-500 text-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-500')}
            >
              {pdfGenerating ? 'Generando PDF...' : 'Descargar Comprobante PDF'}
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="border border-gray-700 rounded p-4 bg-gray-800/40">
            <h3 className="font-semibold mb-3">Resumen de Pago</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Entradas</span><span>S/ {confirmation.ticketsSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Concesiones</span><span>S/ {confirmation.concessionsSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Descuento</span><span className="text-green-500">- S/ {confirmation.discountTotal.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold border-t border-gray-700 pt-2"><span>Total</span><span>S/ {confirmation.grandTotal.toFixed(2)}</span></div>
              {confirmation.promotion && (
                <p className="text-xs text-gray-400">Promoción: {confirmation.promotion.code}</p>
              )}
              <p className="text-xs mt-2">Estado de pago: {confirmation.paymentStatus || 'PAID'}</p>
              {confirmation.createdAt && (
                <p className="text-xs text-gray-500">Fecha: {new Date(confirmation.createdAt).toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="text-center">
            <button onClick={() => window.location.href = '/'} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm">Ir al inicio</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmacion;
