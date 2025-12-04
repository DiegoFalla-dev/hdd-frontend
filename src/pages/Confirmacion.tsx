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
  const confirmation = orderQuery.data;

  // Generar QR desde orderNumber + total al montar datos
  // IMPORTANTE: Este hook DEBE estar antes de cualquier return condicional
  useEffect(() => {
    if (!confirmation) return;
    const payload = JSON.stringify({ order: confirmation.id, total: confirmation.totalAmount });
    QRCode.toDataURL(payload)
      .then(setQrDataUrl)
      .catch(() => toast.error('Error generando QR'));
  }, [confirmation, toast]);

  // --- Renders condicionales DESPUÉS de todos los hooks ---
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

  if (orderQuery.isError || !confirmation) {
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


  const generatePDF = async () => {
    if (!confirmation) return;
    setPdfGenerating(true);
    try {
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 40;
      
      // HEADER - Fondo degradado y título
      pdf.setFillColor(25, 25, 112); // Azul oscuro
      pdf.rect(0, 0, pageWidth, 120, 'F');
      
      // Logo text (simulado)
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont(undefined as any, 'bold');
      pdf.text('CINEPLUS', margin, 50);
      
      pdf.setFontSize(11);
      pdf.setFont(undefined as any, 'normal');
      pdf.text('Tu experiencia cinematográfica premium', margin, 70);
      
      // QR Code en header
      if (qrDataUrl) {
        pdf.addImage(qrDataUrl, 'PNG', pageWidth - 140, 20, 100, 100);
      }
      
      // INFORMACIÓN DE LA ORDEN
      let y = 140;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(18);
      pdf.setFont(undefined as any, 'bold');
      pdf.text('COMPROBANTE DE PAGO', margin, y);
      
      y += 30;
      pdf.setFontSize(10);
      pdf.setFont(undefined as any, 'normal');
      
      // Datos de la orden en dos columnas
      const fecha = confirmation.orderDate
        ? new Date(confirmation.orderDate).toLocaleString('es-PE', { 
            dateStyle: 'long', 
            timeStyle: 'short' 
          })
        : new Date().toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });
      
      pdf.setFont(undefined as any, 'bold');
      pdf.text('N° Orden:', margin, y);
      pdf.setFont(undefined as any, 'normal');
      pdf.text(`${confirmation.id || 'N/A'}`, margin + 80, y);
      
      pdf.setFont(undefined as any, 'bold');
      pdf.text('Estado:', pageWidth / 2, y);
      pdf.setFont(undefined as any, 'normal');
      pdf.text(confirmation.orderStatus || 'COMPLETADO', pageWidth / 2 + 60, y);
      
      y += 20;
      pdf.setFont(undefined as any, 'bold');
      pdf.text('Fecha:', margin, y);
      pdf.setFont(undefined as any, 'normal');
      pdf.text(fecha, margin + 80, y);
      
      // Línea divisoria
      y += 25;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(1);
      pdf.line(margin, y, pageWidth - margin, y);
      
      // SECCIÓN DE ENTRADAS
      y += 25;
      pdf.setFontSize(14);
      pdf.setFont(undefined as any, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y - 12, pageWidth - 2 * margin, 20, 'F');
      pdf.text('🎬  ENTRADAS DE CINE', margin + 5, y);
      
      y += 25;
      pdf.setFontSize(9);
      
      if (confirmation.orderItems && confirmation.orderItems.length > 0) {
        confirmation.orderItems.forEach((item: any, idx: number) => {
          const seatCode = item.seat?.code || item.seat?.id || 'N/A';
          const showtimeId = item.showtime?.id || 'N/A';
          
          pdf.setFont(undefined as any, 'normal');
          pdf.text(`${idx + 1}.`, margin + 10, y);
          pdf.text(`Función: Showtime #${showtimeId}`, margin + 25, y);
          pdf.text(`Asiento: ${seatCode}`, margin + 200, y);
          pdf.setFont(undefined as any, 'bold');
          pdf.text(`S/ ${item.price?.toFixed(2) || '0.00'}`, pageWidth - margin - 60, y, { align: 'right' });
          
          y += 18;
          if (y > 700) { // Nueva página si es necesario
            pdf.addPage();
            y = 60;
          }
        });
      } else {
        pdf.setFont(undefined as any, 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Sin entradas', margin + 10, y);
        pdf.setTextColor(0, 0, 0);
        y += 18;
      }
      
      // SECCIÓN DE CONCESIONES
      y += 15;
      pdf.setFontSize(14);
      pdf.setFont(undefined as any, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y - 12, pageWidth - 2 * margin, 20, 'F');
      pdf.text('🍿  DULCERÍA Y BEBIDAS', margin + 5, y);
      
      y += 25;
      pdf.setFontSize(9);
      
      if ((confirmation as any).orderConcessions && (confirmation as any).orderConcessions.length > 0) {
        (confirmation as any).orderConcessions.forEach((concession: any, idx: number) => {
          pdf.setFont(undefined as any, 'normal');
          pdf.text(`${idx + 1}.`, margin + 10, y);
          pdf.text(`${concession.productName}`, margin + 25, y);
          pdf.text(`Cantidad: ${concession.quantity}`, margin + 250, y);
          pdf.text(`S/ ${concession.unitPrice?.toFixed(2) || '0.00'} c/u`, margin + 350, y);
          pdf.setFont(undefined as any, 'bold');
          pdf.text(`S/ ${concession.totalPrice?.toFixed(2) || '0.00'}`, pageWidth - margin - 60, y, { align: 'right' });
          
          y += 18;
          if (y > 700) {
            pdf.addPage();
            y = 60;
          }
        });
      } else {
        pdf.setFont(undefined as any, 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Sin productos de dulcería', margin + 10, y);
        pdf.setTextColor(0, 0, 0);
        y += 18;
      }
      
      // RESUMEN DE TOTALES
      y += 20;
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      
      y += 20;
      const total = confirmation.totalAmount || 0;
      const ticketsSubtotal = confirmation.orderItems?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) || 0;
      const concessionsSubtotal = (confirmation as any).orderConcessions?.reduce((sum: number, c: any) => sum + (c.totalPrice || 0), 0) || 0;
      const subtotalBeforeTax = total / 1.18;
      const igv = total - subtotalBeforeTax;
      
      pdf.setFontSize(10);
      pdf.setFont(undefined as any, 'normal');
      
      pdf.text('Subtotal Entradas:', pageWidth - margin - 200, y);
      pdf.text(`S/ ${ticketsSubtotal.toFixed(2)}`, pageWidth - margin - 60, y, { align: 'right' });
      
      y += 18;
      pdf.text('Subtotal Concesiones:', pageWidth - margin - 200, y);
      pdf.text(`S/ ${concessionsSubtotal.toFixed(2)}`, pageWidth - margin - 60, y, { align: 'right' });
      
      y += 18;
      pdf.text('Subtotal:', pageWidth - margin - 200, y);
      pdf.text(`S/ ${subtotalBeforeTax.toFixed(2)}`, pageWidth - margin - 60, y, { align: 'right' });
      
      y += 18;
      pdf.text('IGV (18%):', pageWidth - margin - 200, y);
      pdf.text(`S/ ${igv.toFixed(2)}`, pageWidth - margin - 60, y, { align: 'right' });
      
      y += 5;
      pdf.setLineWidth(1);
      pdf.line(pageWidth - margin - 200, y, pageWidth - margin, y);
      
      y += 20;
      pdf.setFontSize(14);
      pdf.setFont(undefined as any, 'bold');
      pdf.text('TOTAL A PAGAR:', pageWidth - margin - 200, y);
      pdf.setFontSize(16);
      pdf.text(`S/ ${total.toFixed(2)}`, pageWidth - margin - 60, y, { align: 'right' });
      
      // Promoción si existe
      if (confirmation.promotion) {
        y += 25;
        pdf.setFontSize(9);
        pdf.setFont(undefined as any, 'italic');
        pdf.setTextColor(0, 128, 0);
        pdf.text(`✓ Promoción aplicada: ${confirmation.promotion.code}`, margin, y);
        pdf.setTextColor(0, 0, 0);
      }
      
      // FOOTER
      y += 40;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, y, pageWidth, 80, 'F');
      
      y += 20;
      pdf.setFontSize(9);
      pdf.setFont(undefined as any, 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Gracias por tu compra en CINEPLUS', pageWidth / 2, y, { align: 'center' });
      
      y += 15;
      pdf.setFontSize(8);
      pdf.text('www.cineplus.com | atencionalcliente@cineplus.com | (01) 555-CINE', pageWidth / 2, y, { align: 'center' });
      
      y += 12;
      pdf.text('Presenta este comprobante en taquilla para recoger tus entradas', pageWidth / 2, y, { align: 'center' });
      
      pdf.save(`orden_${confirmation.id}.pdf`);
      toast.success('PDF generado');
    } catch {
      toast.error('Error generando PDF');
    } finally {
      setPdfGenerating(false);
    }
  };
  const orderStatus = confirmation.orderStatus || 'COMPLETED';
  const statusColor = orderStatus === 'CANCELLED' ? 'bg-red-600' : orderStatus === 'PENDING' ? 'bg-yellow-500' : 'bg-green-600';
  const statusLabel = orderStatus === 'CANCELLED' ? 'Cancelado' : orderStatus === 'PENDING' ? 'Pendiente' : orderStatus === 'REFUNDED' ? 'Reembolsado' : 'Completado';

  return (
    <div style={{ background: 'var(--cineplus-black)', color: 'var(--cineplus-gray-light)' }} className="min-h-screen">
      <Navbar />
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'var(--cineplus-gray-dark)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Orden #{confirmation.id}</h1>
          <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>{statusLabel}</span>
        </div>
        <button className="text-gray-400 hover:text-white" onClick={() => window.location.href = '/'}>
          <FiX size={24} />
        </button>
      </div>
      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-8">
        {/* Columna izquierda: Información de entradas */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Detalle de Entradas</h2>
          <div className="space-y-3">
            {confirmation.orderItems && confirmation.orderItems.length > 0 ? (
              confirmation.orderItems.map((item: any, idx: number) => (
                <div key={idx} className="border border-gray-700 rounded p-4 bg-gray-800/40">
                  <p className="text-xs text-gray-400 mb-1">Showtime: {item.showtime?.id || 'N/A'}</p>
                  <p className="text-sm font-semibold mb-1">Asiento: {item.seat?.code || item.seat?.id || 'N/A'}</p>
                  <p className="text-sm mb-1">Precio: S/ {item.price?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-gray-500">Estado: {item.ticketStatus || 'ACTIVE'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Sin entradas</p>
            )}
          </div>
          
          <h2 className="text-lg font-semibold mt-6 mb-4">Concesiones (Dulcería)</h2>
          <div className="space-y-3">
            {(confirmation as any).orderConcessions && (confirmation as any).orderConcessions.length > 0 ? (
              (confirmation as any).orderConcessions.map((concession: any, idx: number) => (
                <div key={idx} className="border border-gray-700 rounded p-4 bg-gray-800/40">
                  <p className="text-sm font-semibold mb-1">{concession.productName}</p>
                  <p className="text-sm mb-1">Cantidad: {concession.quantity}</p>
                  <p className="text-sm mb-1">Precio unitario: S/ {concession.unitPrice?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm font-bold">Total: S/ {concession.totalPrice?.toFixed(2) || '0.00'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Sin productos de dulcería</p>
            )}
          </div>
        </div>

        {/* Columna derecha: Resumen y acciones */}
        <div className="space-y-6">
          <div className="border border-gray-700 rounded p-6 bg-gray-800/40">
            <h3 className="font-semibold mb-4 text-lg">Resumen de Orden (Preview)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Entradas</span>
                <span>S/ {(confirmation.orderItems?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Concesiones</span>
                <span>S/ {((confirmation as any).orderConcessions?.reduce((sum: number, c: any) => sum + (c.totalPrice || 0), 0) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IGV (18%)</span>
                <span>S/ {((confirmation.totalAmount || 0) - (confirmation.totalAmount || 0) / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Descuento</span>
                <span className="text-green-400">- S/ 0.00</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-700 pt-2">
                <span>Total</span>
                <span>S/ {confirmation.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <p className="text-sm flex justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className="font-medium">{confirmation.orderStatus || 'COMPLETED'}</span>
                </p>
                {confirmation.orderDate && (
                  <p className="text-sm flex justify-between">
                    <span className="text-gray-400">Fecha:</span>
                    <span className="font-medium">{new Date(confirmation.orderDate).toLocaleString()}</span>
                  </p>
                )}
                {confirmation.promotion && (
                  <p className="text-sm text-green-400 flex justify-between">
                    <span>Promoción:</span>
                    <span className="font-medium">{confirmation.promotion.code}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {qrDataUrl && (
            <div className="border border-gray-700 rounded p-6 bg-gray-800/40 flex flex-col items-center">
              <img src={qrDataUrl} alt="QR Orden" className="w-48 h-48 mb-3" />
              <p className="text-xs text-gray-400 text-center">Escanea para verificar compra</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={generatePDF}
              disabled={pdfGenerating}
              className={"w-full px-4 py-3 rounded text-sm font-semibold transition " + (pdfGenerating ? 'bg-gray-500 text-gray-200 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500')}
            >
              {pdfGenerating ? 'Generando PDF...' : 'Descargar Comprobante PDF'}
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="w-full px-4 py-3 rounded bg-gray-700 text-white text-sm font-semibold hover:bg-gray-600 transition"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmacion;
