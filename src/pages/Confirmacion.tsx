import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { FiX } from 'react-icons/fi';
import { useOrder } from '../hooks/useOrder';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { useToast } from '../components/ToastProvider';
import { clearOrderStorage } from '../utils/storage';
import { useCartStore } from '../store/cartStore';
import { useSeatSelectionStore } from '../store/seatSelectionStore';
import { useTicketTypes } from '../hooks/useTicketTypes';

const Confirmacion: React.FC = () => {
  const { orderId: orderIdParam } = useParams();
  const toast = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const numericId = orderIdParam ? parseInt(orderIdParam, 10) : undefined;
  const orderQuery = useOrder(numericId);
  const confirmation = orderQuery.data;
  const ticketTypesQuery = useTicketTypes();
  const ticketTypes = ticketTypesQuery.data || [];

  // Utility: Extract ID from "ticket-{id}" and find name in ticket_types table
  const getTicketTypeName = (ticketTypeStr: string | undefined | { name?: string; code?: string }): string => {
    if (!ticketTypeStr) return 'N/A';
    if (typeof ticketTypeStr === 'object') return ticketTypeStr.name || ticketTypeStr.code || 'N/A';
    
    // Extract ID from "ticket-5" format
    const match = ticketTypeStr.match(/ticket-(\d+)/);
    if (match) {
      const ticketId = parseInt(match[1], 10);
      const ticketType = ticketTypes.find(t => t.id === ticketId);
      return ticketType?.name || ticketTypeStr;
    }
    return ticketTypeStr;
  };

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
      const LOGO_URL = 'https://i.imgur.com/K9o09F6.png';
      
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
      const headerHeight = 100;
      pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.rect(0, 0, pageWidth, headerHeight, 'F');

      // QR Code en header derecha (con margen seguro)
      const qrSize = 80; // Más pequeño para que todo quepa en una línea
      const qrX = pageWidth - margin - qrSize;
      const qrY = (headerHeight - qrSize) / 2; // Centrado verticalmente
      if (qrDataUrl) {
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      // Logo en header izquierda (70% del tamaño del QR)
      const logoSize = qrSize * 0.8; // ~64pt
      const logoY = (headerHeight - logoSize) / 2; // Centrado verticalmente
      try {
        pdf.addImage(LOGO_URL, 'PNG', margin, logoY, logoSize, logoSize);
      } catch (e) {
        console.error('Error cargando logo:', e);
      }

      // Texto del header (ajustado a la derecha del logo, centrado verticalmente)
      const textX = margin + logoSize + 12; // 12pt de separación del logo
      const textCenterY = headerHeight / 2;
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CINEPLUS', textX, textCenterY - 5); // Título ligeramente arriba del centro

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Tu experiencia cinematográfica premium', textX, textCenterY + 10); // Subtítulo ligeramente abajo

      y = headerHeight + 20;

      // Determinar tipo de comprobante desde la orden
      const isFactura = confirmation.invoiceType === 'FACTURA';
      const comprobanteType = isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';

      // INFORMACIÓN DE LA ORDEN - Título centrado
      pdf.setTextColor(COLORS.textStrong.r, COLORS.textStrong.g, COLORS.textStrong.b);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(comprobanteType, pageWidth / 2, y, { align: 'center' });

      y += 25;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Datos de la orden en dos columnas
      // Comentado: manejo seguro de undefined en la fecha
      // const fecha = confirmation.orderDate || confirmation.createdAt
      //   ? new Date(confirmation.orderDate || confirmation.createdAt).toLocaleString('es-PE', {
      const fecha = (confirmation.orderDate || confirmation.createdAt)
        ? new Date(confirmation.orderDate || confirmation.createdAt || new Date()).toLocaleString('es-PE', {
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

      // Datos del comprador/cliente
      y += 20;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text(isFactura ? 'Cliente:' : 'Comprador:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      
      if (isFactura) {
        // FACTURA: Razón Social y RUC
        const razonSocial = confirmation.user?.razonSocial || 'N/A';
        const ruc = confirmation.user?.ruc || 'N/A';
        pdf.text(`${razonSocial} - RUC: ${ruc}`, margin + 80, y);
      } else {
        // BOLETA: Nombre y DNI
        const nombre = [confirmation.user?.firstName, confirmation.user?.lastName].filter(Boolean).join(' ') || confirmation.user?.username || 'N/A';
        const dni = confirmation.user?.nationalId || 'N/A';
        pdf.text(`${nombre}`, margin + 80, y);
        y += 12;
        pdf.text(`DNI: ${dni}`, margin + 80, y);
      }

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
      const movieTitle = confirmation.orderItems?.[0]?.movie?.title || confirmation.movie?.title || confirmation.orderItems?.[0]?.showtime?.movieTitle || 'Película N/A';
      const movieWrapped = pdf.splitTextToSize(movieTitle, imageX - margin - 15);
      pdf.text(movieWrapped, margin + 70, y);
      y += movieWrapped.length > 1 ? 15 : 12;

      // Cine y Sala
      const cinemaName = confirmation.orderItems?.[0]?.showtime?.cinemaName || 'N/A';
      const theaterName = confirmation.orderItems?.[0]?.showtime?.theaterName || 'N/A';
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Cine:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text(`${cinemaName} - Sala ${theaterName}`, margin + 70, y);
      y += 12;

      // Formato
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Formato:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      // Comentado: manejo seguro del format que puede ser undefined
      const format = (confirmation.orderItems?.[0]?.showtime?.format || 'N/A');
      const formatClean = typeof format === 'string' ? format.replace(/^_/, '') : format;
      pdf.text(formatClean, margin + 70, y);
      y += 12;

      // Duración
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Duración:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      
      // Debug: verificar qué datos tenemos
      console.log('Movie data:', confirmation.orderItems?.[0]?.movie);
      console.log('Duration:', confirmation.orderItems?.[0]?.movie?.duration);
      
      const duration = confirmation.orderItems?.[0]?.movie?.duration || confirmation.movie?.duration;
      const durationText = duration ? `${duration} min` : 'N/A';
      pdf.text(durationText, margin + 70, y);
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
        const movieImage = confirmation.orderItems?.[0]?.movie?.posterUrl || confirmation.orderItems?.[0]?.movie?.image || confirmation.movie?.posterUrl || confirmation.movie?.image;
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

      // SECCIÓN DE ENTRADAS - FORMATO TABLA
      y += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.text('ENTRADAS DE CINE', margin, y);

      y += 15;
      pdf.setFontSize(9);

      // Encabezado de tabla
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('#', margin, y);
      pdf.text('Descripción', margin + 20, y);
      pdf.text('Asiento', margin + 280, y);
      pdf.text('Precio', pageWidth - margin - 60, y, { align: 'right' });
      
      y += 3;
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      pdf.setFont('helvetica', 'normal');

      if (confirmation.orderItems && confirmation.orderItems.length > 0) {
        confirmation.orderItems.forEach((item, idx) => {
          // Comentado: item.seat no existe, se usa seatCode y seatId
          // const seatType = item.seat?.seatType || 'Regular';
          // const seatCode = item.seat?.code || item.seat?.id || 'N/A';
          const seatCode = item.seatCode || item.seatId?.toString() || 'N/A';
          const seatType = 'Regular'; // Comentado: no viene en OrderItemDTO
          const ticketTypeName = getTicketTypeName(item.ticketType) || 'Regular';

          pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
          pdf.text(`${idx + 1}`, margin, y);
          pdf.text(`${ticketTypeName} (${seatType})`, margin + 20, y);
          pdf.text(seatCode, margin + 280, y);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
          pdf.text(`S/ ${item.price?.toFixed(2) || '0.00'}`, pageWidth - margin - 60, y, { align: 'right' });
          pdf.setFont('helvetica', 'normal');
          y += 12;
        });
      } else {
        pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
        pdf.text('Sin entradas registradas', margin + 20, y);
        y += 12;
      }

      y += 5;

      // SECCIÓN DE CONCESIONES (Dulcería) - FORMATO TABLA
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

        // Encabezado de tabla
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
        pdf.text('#', margin, y);
        pdf.text('Producto', margin + 20, y);
        pdf.text('Cant.', margin + 280, y);
        pdf.text('P. Unit.', margin + 340, y);
        pdf.text('Total', pageWidth - margin - 60, y, { align: 'right' });
        
        y += 3;
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 10;

        pdf.setFont('helvetica', 'normal');

        confirmation.orderConcessions.forEach((concession, idx) => {
          pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
          pdf.text(`${idx + 1}`, margin, y);
          pdf.text(concession.productName || 'Producto N/A', margin + 20, y);
          pdf.text(`${concession.quantity}`, margin + 280, y);
          pdf.text(`S/ ${concession.unitPrice?.toFixed(2) || '0.00'}`, margin + 340, y);
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

      // RESUMEN DE TOTALES - FORMATO TABLA
      y += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.text('RESUMEN DE COMPRA', margin, y);

      y += 15;
      const ticketsSubtotal = confirmation.orderItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
      const concessionsSubtotal = confirmation.orderConcessions?.reduce((sum, c) => sum + (c.totalPrice || 0), 0) || 0;
      const subtotalBeforeTax = confirmation.subtotalAmount || (ticketsSubtotal + concessionsSubtotal);
      const igv = confirmation.taxAmount || ((confirmation.totalAmount || 0) - subtotalBeforeTax);
      const total = confirmation.totalAmount;

      pdf.setFontSize(9);

      // Encabezado de tabla resumen
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
      pdf.text('Concepto', margin, y);
      pdf.text('Monto', pageWidth - margin - 60, y, { align: 'right' });
      
      y += 3;
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 12;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const rightCol = pageWidth - margin - 60;

      // Subtotal Entradas
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      pdf.text('Subtotal Entradas:', margin, y);
      pdf.text(`S/ ${ticketsSubtotal.toFixed(2)}`, rightCol, y, { align: 'right' });
      y += 12;

      // Subtotal Dulcería
      pdf.text('Subtotal Dulcería:', margin, y);
      pdf.text(`S/ ${concessionsSubtotal.toFixed(2)}`, rightCol, y, { align: 'right' });
      y += 12;

      // Subtotal
      pdf.setFont('helvetica', 'bold');
      pdf.text('Subtotal:', margin, y);
      pdf.text(`S/ ${subtotalBeforeTax.toFixed(2)}`, rightCol, y, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      y += 12;

      // Mostrar descuentos si existen
      const discountAmount = confirmation.discountAmount || 0;
      const fidelityDiscount = confirmation.fidelityDiscountAmount || 0;
      // El backend envía el descuento de promoción en promotion.value
      const promotionDiscountAmount = confirmation.promotion?.value || confirmation.promotion?.discountAmount || 0;
      
      // Sumar todos los descuentos posibles
      const totalDiscount = discountAmount + fidelityDiscount + promotionDiscountAmount;
      
      if (totalDiscount > 0) {
        pdf.setTextColor(34, 197, 94); // Verde para descuento
        const promotionText = confirmation.promotion?.code ? `Descuento (${confirmation.promotion.code})` : 'Descuento';
        pdf.text(promotionText, margin, y);
        pdf.text(`- S/ ${totalDiscount.toFixed(2)}`, rightCol, y, { align: 'right' });
        pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
        y += 12;
      }

      // IGV
      pdf.text('IGV (18%):', margin, y);
      pdf.text(`S/ ${igv.toFixed(2)}`, rightCol, y, { align: 'right' });
      y += 15;

      // Línea separadora antes del total
      pdf.setLineWidth(1);
      pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 15;

      // TOTAL
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
  // Comentado: statusColor no se usa
  // const statusColor = orderStatus === 'CANCELLED' ? 'bg-red-600' : orderStatus === 'PENDING' ? 'bg-yellow-500' : 'bg-green-600';
  const statusLabel = orderStatus === 'CANCELLED' ? 'Cancelado' : orderStatus === 'PENDING' ? 'Pendiente' : orderStatus === 'REFUNDED' ? 'Reembolsado' : 'Completado';

  return (
    <div style={{ background: "linear-gradient(180deg, #141113 0%, #0b0b0b 100%)" }} className="min-h-screen animate-fade-in">
      <Navbar />
      <div className="flex justify-between items-center p-6 border-b backdrop-blur-md sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(20,17,19,0.8)" }}>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#BB2228] to-[#E3E1E2] bg-clip-text text-transparent">Orden #{confirmation.id}</h1>
          <span className={`text-sm font-bold px-4 py-2 rounded-lg ${
            orderStatus === 'CANCELLED' ? 'bg-red-600/20 text-red-400' : orderStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-600/20 text-green-400'
          }`}>
            ✓ {statusLabel}
          </span>
        </div>
        <button className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 hover:rotate-90" onClick={() => window.location.href = '/'}>
          <FiX size={24} />
        </button>
      </div>
      <div className="max-w-6xl mx-auto p-8 grid md:grid-cols-3 gap-8 animate-slide-up">
        {/* Columna izquierda: Información de entradas */}
        <div className="md:col-span-2 space-y-6">
          {/* Sección de Entradas */}
          <div className="card-glass rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#EFEFEE]">🎫 Entradas Confirmadas</h2>
            <div className="space-y-4">
              {confirmation.orderItems && confirmation.orderItems.length > 0 ? (
                (() => {
                  let pendingOrder: Record<string, unknown> | null = null;
                  try {
                    const pending = localStorage.getItem('pendingOrder');
                    if (pending) pendingOrder = JSON.parse(pending);
                  } catch {
                    pendingOrder = null;
                  }

                  return confirmation.orderItems.map((item, idx) => {
                    const seatCode = item.seatCode || item.seatId?.toString() || ((pendingOrder?.seats as any[])?.[idx]);
                    // Comentado: item no tiene seat, usar directamente del item
                    let ticketType = item.ticketType || item.seatCode;
                    if (!ticketType && pendingOrder && (pendingOrder.entradas as any[])?.[idx]) {
                      const entrada = (pendingOrder.entradas as any[])[idx];
                      ticketType = entrada?.nombre || entrada?.code;
                    }
                    
                    return (
                      <div key={idx} className="bg-gradient-to-r from-[#393A3A]/20 to-transparent rounded-xl p-5 border border-[#BB2228]/30 hover:border-[#BB2228]/60 transition-all duration-300 animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="badge-gradient-red px-3 py-1 rounded-lg text-sm font-bold">Entrada {idx + 1}</span>
                          <span className="text-2xl font-bold text-[#BB2228]">S/ {item.price?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-[#E3E1E2]">
                          <div>
                            <p className="text-[#E3E1E2]/60 text-xs mb-1">Película</p>
                            <p className="font-bold">{confirmation.orderItems?.[0]?.movie?.title || confirmation.movie?.title || confirmation.orderItems?.[0]?.showtime?.movieTitle || 'Película N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[#E3E1E2]/60 text-xs mb-1">Asiento</p>
                            <p className="font-bold text-lg">{seatCode || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[#E3E1E2]/60 text-xs mb-1">Tipo</p>
                            <p className="font-bold">{getTicketTypeName(ticketType)}</p>
                          </div>
                          <div>
                            <p className="text-[#E3E1E2]/60 text-xs mb-1">Estado</p>
                            <p className="font-bold text-green-400">✓ Confirmada</p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <p className="text-sm text-[#E3E1E2]/60">Sin entradas registradas</p>
              )}
            </div>
          </div>
          
          {/* Sección de Dulcería */}
          <div className="card-glass rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#EFEFEE]">🍿 Dulcería y Bebidas</h2>
            <div className="space-y-4">
              {confirmation.orderConcessions && confirmation.orderConcessions.length > 0 ? (
                confirmation.orderConcessions.map((concession, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-[#393A3A]/20 to-transparent rounded-xl p-5 border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-lg font-bold text-[#EFEFEE]">{concession.productName}</p>
                      <span className="badge-gradient-gold px-3 py-1 rounded-lg text-sm font-bold">x{concession.quantity}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-[#E3E1E2]">
                      <span>S/ {concession.unitPrice?.toFixed(2) || '0.00'} c/u</span>
                      <span className="text-xl font-bold text-amber-400">S/ {concession.totalPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#E3E1E2]/60 text-center py-4">🍿 No hay productos de dulcería</p>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha: Resumen, QR y acciones */}
        <div className="md:col-span-1 space-y-6">
          {/* Resumen de Orden */}
          <div className="card-glass rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#EFEFEE] to-[#BB2228] bg-clip-text text-transparent">Resumen</h3>
            <div className="space-y-3 text-sm">
              {/* Entradas */}
              <div className="flex justify-between pb-3 border-b border-[#E3E1E2]/20">
                <span className="text-[#E3E1E2]/80">🎫 Entradas</span>
                <span className="font-bold text-[#EFEFEE]">S/ {(confirmation.orderItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0).toFixed(2)}</span>
              </div>
              {/* Concesiones */}
              <div className="flex justify-between pb-3 border-b border-[#E3E1E2]/20">
                <span className="text-[#E3E1E2]/80">🍿 Dulcería</span>
                <span className="font-bold text-[#EFEFEE]">S/ {(confirmation.orderConcessions?.reduce((sum, c) => sum + (c.totalPrice || 0), 0) || 0).toFixed(2)}</span>
              </div>
              {/* Subtotal */}
              <div className="flex justify-between py-3 border-t border-b border-[#BB2228]/30 bg-[#BB2228]/10 px-3 rounded-lg">
                <span className="font-bold text-[#EFEFEE]">Subtotal</span>
                <span className="font-bold text-[#EFEFEE]">S/ {(confirmation.subtotalAmount || (confirmation.orderItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0) + (confirmation.orderConcessions?.reduce((sum, c) => sum + (c.totalPrice || 0), 0) || 0)).toFixed(2)}</span>
              </div>
              {/* Descuentos */}
              {confirmation.promotion && (
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>🎉 {confirmation.promotion.code}</span>
                  <span>- S/ {((confirmation.subtotalAmount || 0) - ((confirmation.totalAmount || 0) - (confirmation.taxAmount || 0))).toFixed(2)}</span>
                </div>
              )}
              {/* IGV */}
              <div className="flex justify-between text-[#E3E1E2]/80">
                <span>IGV (18%)</span>
                <span className="font-bold">S/ {(confirmation.taxAmount || ((confirmation.totalAmount || 0) - (confirmation.subtotalAmount || 0))).toFixed(2)}</span>
              </div>
              {/* Total */}
              <div className="flex justify-between pt-4 border-t-2 border-[#BB2228]">
                <span className="text-lg font-bold text-[#EFEFEE]">Total a Pagar</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-[#BB2228] to-[#8B191E] bg-clip-text text-transparent">S/ {confirmation.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Información del Comprador */}
          <div className="card-glass rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-4 text-[#EFEFEE]">👤 Comprador</h4>
            <div className="space-y-2 text-sm text-[#E3E1E2]">
              <p className="flex justify-between"><span className="opacity-70">Nombre:</span> <span className="font-bold">{[confirmation.user?.firstName, confirmation.user?.lastName].filter(Boolean).join(' ') || confirmation.user?.username || 'N/A'}</span></p>
              {confirmation.user?.nationalId && <p className="flex justify-between"><span className="opacity-70">DNI:</span> <span className="font-bold">{confirmation.user.nationalId}</span></p>}
              {confirmation.user?.email && <p className="flex justify-between"><span className="opacity-70">Email:</span> <span className="font-bold text-xs break-all">{confirmation.user.email}</span></p>}
            </div>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="card-glass rounded-2xl p-6 flex flex-col items-center">
              <img src={qrDataUrl} alt="QR Orden" className="w-40 h-40 mb-4 rounded-lg shadow-lg" />
              <p className="text-xs text-[#E3E1E2]/60 text-center">📍 Escanea para verificar tu compra</p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="space-y-3">
            <button
              onClick={generatePDF}
              disabled={pdfGenerating}
              className="w-full btn-primary-gradient py-4 rounded-xl font-bold text-base hover:scale-105 transition-transform duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfGenerating ? '⏳ Generando...' : '📥 Descargar Comprobante'}
            </button>
            <button 
              onClick={() => {
                useCartStore.getState().clearCart();
                useCartStore.getState().clearPromotion();
                useSeatSelectionStore.getState().clearAll();
                clearOrderStorage();
                setTimeout(() => {
                  window.location.href = '/';
                }, 100);
              }} 
              className="w-full btn-secondary-outline py-4 rounded-xl font-bold text-base hover:scale-105 transition-transform duration-300"
            >
              🎭 Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmacion;
