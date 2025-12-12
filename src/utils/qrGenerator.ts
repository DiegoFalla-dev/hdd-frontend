import QRCode from 'qrcode';

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { FiX } from 'react-icons/fi';
import { useOrder } from '../hooks/useOrder';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
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
      const format = (confirmation.orderItems?.[0]?.showtime?.format || 'N/A').replace(/^_/, '');
      pdf.text(format, margin + 70, y);
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
          const seatType = item.seat?.seatType || 'Regular';
          const seatCode = item.seat?.code || item.seat?.id || 'N/A';
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
          pdf.text(concession.productName, margin + 20, y);
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