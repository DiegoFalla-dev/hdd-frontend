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

  // Generar QR con ALTA CALIDAD desde orderNumber + total al montar datos
  // IMPORTANTE: Este hook DEBE estar antes de cualquier return condicional
  useEffect(() => {
    if (!confirmation) return;
    const payload = JSON.stringify({ 
      orderId: confirmation.id, 
      total: confirmation.totalAmount,
      date: confirmation.purchaseDate,
      items: confirmation.items?.length || 0,
    });
    
    QRCode.toDataURL(payload, {
      width: 512, // Alta resolución para impresión
      margin: 2,
      color: {
        dark: '#141113',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // Máxima corrección de errores
    })
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
      const COLORS = {
        primary: { r: 187, g: 34, b: 40 },      // #BB2228 - rojo brillante
        primaryDark: { r: 92, g: 18, b: 20 },   // #5C1214 - rojo oscuro
        textDefault: { r: 57, g: 58, b: 58 },   // #393A3A
        textStrong: { r: 20, g: 17, b: 19 },    // #141113
        bgLight: { r: 239, g: 239, b: 238 },    // #EFEFEE
      };

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      let y = margin;

      // HEADER - Fondo con color primario
      pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.rect(0, 0, pageWidth, 110, 'F');

      // Texto del header
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CINEPLUS', margin, 40);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Tu experiencia cinematográfica premium', margin, 58);

      // QR Code en header derecha
      if (qrDataUrl) {
        pdf.addImage(qrDataUrl, 'PNG', pageWidth - 130, 10, 110, 110);
      }

      y = 125;

      // INFORMACIÓN DE LA ORDEN - Título centrado
      pdf.setTextColor(COLORS.textStrong.r, COLORS.textStrong.g, COLORS.textStrong.b);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPROBANTE DE PAGO', pageWidth / 2, y, { align: 'center' });

      y += 25;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Datos de la orden en dos columnas
      const fecha = confirmation.orderDate || confirmation.createdAt
        ? new Date(confirmation.orderDate || confirmation.createdAt).toLocaleString('es-PE', {
            dateStyle: 'long',
            timeStyle: 'short'
          })
        : new Date().toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });

      // Primera columna
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('N° Orden:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text(`${confirmation.id}`, margin + 70, y);

      // Segunda columna
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Estado:', pageWidth / 2 + 20, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      const estado = confirmation.orderStatus === 'COMPLETED' ? 'CANCELADO' : confirmation.orderStatus || 'COMPLETADO';
      pdf.text(estado, pageWidth / 2 + 90, y);

      y += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Fecha:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text(fecha, margin + 70, y);

      y += 20;
      pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.setLineWidth(1.5);
      pdf.line(margin, y, pageWidth - margin, y);

      // DATOS DE LA PELÍCULA CON IMAGEN
      y += 20;
      const imageX = pageWidth - margin - 70;
      const imageY = y;
      const imageSize = 80;

      // Información de la película (lado izquierdo)
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.text('PELÍCULA Y FUNCIÓN', margin, y);

      y += 18;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);

      // Nombre de la película
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Película:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      const movieTitle = confirmation.movie?.title || 'N/A';
      const movieWrapped = pdf.splitTextToSize(movieTitle, imageX - margin - 15);
      pdf.text(movieWrapped, margin + 70, y);
      y += movieWrapped.length > 1 ? 15 : 12;

      // Formato
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Formato:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      const format = confirmation.orderItems?.[0]?.showtime?.format || 'N/A';
      pdf.text(format, margin + 70, y);
      y += 12;

      // Duración
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Duración:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      const duration = confirmation.movie?.duration || 'N/A';
      pdf.text(`${duration} min`, margin + 70, y);
      y += 12;

      // Horario
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Horario:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      const showtime = confirmation.orderItems?.[0]?.showtime?.time || 'N/A';
      const showtimeDate = confirmation.orderItems?.[0]?.showtime?.date || 'N/A';
      const horariFull = `${showtimeDate} ${showtime}`;
      pdf.text(horariFull, margin + 70, y);

      // Imagen de la película (lado derecho)
      try {
        const movieImage = confirmation.movie?.posterUrl || confirmation.movie?.image;
        if (movieImage) {
          pdf.addImage(movieImage, 'PNG', imageX, imageY - 5, imageSize, imageSize);
        }
      } catch (e) {
        console.error('Error cargando imagen de película:', e);
      }

      y = Math.max(y + 15, imageY + imageSize + 10);

      y += 10;
      pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.setLineWidth(1);
      pdf.line(margin, y, pageWidth - margin, y);

      // SECCIÓN DE ENTRADAS
      y += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.text('ENTRADAS DE CINE', margin, y);

      y += 15;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      if (confirmation.orderItems && confirmation.orderItems.length > 0) {
        confirmation.orderItems.forEach((item, idx) => {
          const seatType = item.seat?.seatType || 'Regular';
          const seatCode = item.seat?.code || item.seat?.id || 'N/A';
          const ticketType = item.ticketType || 'N/A';

          pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
          pdf.text(`${idx + 1}. ${ticketType} - Asiento: ${seatCode} (${seatType})`, margin, y);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
          pdf.text(`S/ ${item.price?.toFixed(2) || '0.00'}`, pageWidth - margin - 60, y, { align: 'right' });
          pdf.setFont('helvetica', 'normal');
          y += 12;
        });
      } else {
        pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
        pdf.text('Sin entradas registradas', margin, y);
        y += 12;
      }

      y += 5;

      // SECCIÓN DE CONCESIONES (Dulcería)
      if (confirmation.orderConcessions && confirmation.orderConcessions.length > 0) {
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y, pageWidth - margin, y);

        y += 15;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
        pdf.text('DULCERÍA Y BEBIDAS', margin, y);

        y += 15;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        confirmation.orderConcessions.forEach((concession, idx) => {
          pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
          pdf.text(`${idx + 1}. ${concession.productName}`, margin, y);
          pdf.text(`Cant: ${concession.quantity}`, margin + 180, y);
          pdf.text(`S/ ${concession.unitPrice?.toFixed(2) || '0.00'} c/u`, margin + 280, y);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
          pdf.text(`S/ ${concession.totalPrice?.toFixed(2) || '0.00'}`, pageWidth - margin - 60, y, { align: 'right' });
          pdf.setFont('helvetica', 'normal');
          y += 12;
        });

        y += 5;
      }

      // Línea antes de resumen
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);

      // RESUMEN DE TOTALES
      y += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.text('RESUMEN DE COMPRA', margin, y);

      y += 20;
      const ticketsSubtotal = confirmation.orderItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
      const concessionsSubtotal = confirmation.orderConcessions?.reduce((sum, c) => sum + (c.totalPrice || 0), 0) || 0;
      const subtotalBeforeTax = confirmation.subtotalAmount || (ticketsSubtotal + concessionsSubtotal);
      const igv = confirmation.taxAmount || ((confirmation.totalAmount || 0) - subtotalBeforeTax);
      const total = confirmation.totalAmount;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);

      const rightCol = pageWidth - margin - 100;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Subtotal Entradas:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text(`S/ ${ticketsSubtotal.toFixed(2)}`, rightCol, y, { align: 'right' });

      y += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Subtotal Dulcería:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text(`S/ ${concessionsSubtotal.toFixed(2)}`, rightCol, y, { align: 'right' });

      y += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Subtotal:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text(`S/ ${subtotalBeforeTax.toFixed(2)}`, rightCol, y, { align: 'right' });

      y += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('IGV (18%):', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text(`S/ ${igv.toFixed(2)}`, rightCol, y, { align: 'right' });

      y += 18;
      pdf.setLineWidth(2);
      pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.line(rightCol - 95, y, rightCol, y);

      y += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.text('TOTAL A PAGAR:', margin, y);
      pdf.setFontSize(16);
      pdf.text(`S/ ${total.toFixed(2)}`, rightCol, y, { align: 'right' });

      // FOOTER
      y = pageHeight - 80;
      pdf.setFillColor(COLORS.bgLight.r, COLORS.bgLight.g, COLORS.bgLight.b);
      pdf.rect(0, y - 10, pageWidth, 80, 'F');

      y += 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text('Gracias por tu compra en CINEPLUS', pageWidth / 2, y, { align: 'center' });

      y += 12;
      pdf.setFontSize(8);
      pdf.text('www.cineplus.com | atencionalcliente@cineplus.com | (01) 555-CINE', pageWidth / 2, y, { align: 'center' });

      y += 10;
      pdf.text('Presenta este comprobante en taquilla para recoger tus entradas', pageWidth / 2, y, { align: 'center' });

      pdf.save(`comprobante_orden_${confirmation.id}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF');
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
              (() => {
                // Intentar obtener datos del pendingOrder como fallback
                let pendingOrder: any = null;
                try {
                  const pending = localStorage.getItem('pendingOrder');
                  if (pending) pendingOrder = JSON.parse(pending);
                } catch {}

                return confirmation.orderItems.map((item, idx) => {
                  // Usar seat code del backend, o del pendingOrder si no está disponible
                  const seatCode = item.seat?.code || (pendingOrder?.seats?.[idx]);
                  
                  // Usar ticketType del backend, o del entradas en pendingOrder
                  let ticketType = item.ticketType || item.seat?.ticketType;
                  if (!ticketType && pendingOrder?.entradas?.[idx]) {
                    ticketType = pendingOrder.entradas[idx].nombre || pendingOrder.entradas[idx].code;
                  }
                  
                  // Usar movieTitle del pendingOrder como fallback
                  const movieTitle = item.movie?.title || confirmation.movie?.title || pendingOrder?.movieTitle || 'Película N/A';
                  
                  return (
                    <div key={idx} className="border border-gray-700 rounded p-4 bg-gray-800/40">
                      <p className="text-sm font-semibold mb-2">{movieTitle}</p>
                      <p className="text-sm mb-1">Asiento: <span className="font-bold">{seatCode || 'N/A'}</span></p>
                      <p className="text-sm mb-1">Tipo: {ticketType || 'N/A'}</p>
                      <p className="text-sm">Precio: S/ {item.price?.toFixed(2) || '0.00'}</p>
                    </div>
                  );
                });
              })()
            ) : (
              <p className="text-sm text-gray-400">Sin entradas</p>
            )}
          </div>
          
          <h2 className="text-lg font-semibold mt-6 mb-4">Detalle de Dulcería</h2>
          <div className="space-y-3">
            {confirmation.orderConcessions && confirmation.orderConcessions.length > 0 ? (
              confirmation.orderConcessions.map((concession, idx) => (
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
            <h3 className="font-semibold mb-4 text-lg">Resumen de Orden</h3>
            <div className="space-y-2 text-sm">
              {/* Mostrar subtotal de entradas */}
              <div className="flex justify-between">
                <span>Entradas</span>
                <span>S/ {(confirmation.orderItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0).toFixed(2)}</span>
              </div>
              {/* Mostrar subtotal de concesiones */}
              <div className="flex justify-between">
                <span>Concesiones</span>
                <span>S/ {(confirmation.orderConcessions?.reduce((sum, c) => sum + (c.totalPrice || 0), 0) || 0).toFixed(2)}</span>
              </div>
              {/* Mostrar subtotal total (antes de impuestos) */}
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <span>Subtotal</span>
                <span>S/ {(confirmation.subtotalAmount || (confirmation.orderItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0) + (confirmation.orderConcessions?.reduce((sum, c) => sum + (c.totalPrice || 0), 0) || 0)).toFixed(2)}</span>
              </div>
              {/* Mostrar IGV usando el valor del backend si está disponible */}
              <div className="flex justify-between">
                <span>IGV (18%)</span>
                <span>S/ {(confirmation.taxAmount || ((confirmation.totalAmount || 0) - (confirmation.subtotalAmount || 0))).toFixed(2)}</span>
              </div>
              {/* Línea final con total */}
              <div className="flex justify-between font-semibold border-t border-gray-700 pt-2">
                <span>Total a Pagar</span>
                <span>S/ {confirmation.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
              {/* Información adicional */}
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
