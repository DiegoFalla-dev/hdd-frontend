import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { OrderDTO } from '../services/orderService';
// Comentado: api no se usa
// import api from '../services/apiClient';

const LOGO_URL = 'https://i.imgur.com/K9o09F6.png';

/**
 * Mapeo manual de ticket-{id} a nombres
 * Este mapeo debería venir del backend, pero como fallback aquí está
 */
const ticketTypeMapping: Record<string, string> = {
  'ticket-1': 'PROMO ONLINE',
  'ticket-2': 'Silla de ruedas',
  'ticket-3': '50% DCTO BANCO RIPLEY',
  'ticket-4': 'Persona con discapacidad',
  'ticket-5': 'Niño',   
  'ticket-6': 'Adulto',  
};

/**
 * Extrae el nombre del tipo de entrada desde el código
 * Primero intenta el mapeo manual, luego retorna el valor tal cual
 */
const getTicketTypeName = (ticketTypeStr: string | undefined | { name?: string; code?: string }): string => {
  if (!ticketTypeStr) return 'Regular';
  if (typeof ticketTypeStr === 'object') return ticketTypeStr.name || ticketTypeStr.code || 'Regular';
  
  // Buscar en el mapeo manual
  if (ticketTypeMapping[ticketTypeStr]) {
    return ticketTypeMapping[ticketTypeStr];
  }
  
  // Si es string, retorna tal cual
  return ticketTypeStr || 'Regular';
};

/**
 * Genera PDF idéntico a Confirmacion.tsx
 * ESTA FUNCIÓN DEBE PRODUCIR EXACTAMENTE EL MISMO RESULTADO
 */
export const generateOrderPDF = async (confirmation: OrderDTO) => {
  // Si el usuario no viene en la orden, intentar obtenerlo del usuario actual
  // Comentado: confirmation.userId no existe, se usa confirmation.user directamente
  // if (!confirmation.user && confirmation.id) {
  //   try {
  //     const userResponse = await api.get(`/users/${confirmation.userId || 'current'}`);
  //     if (userResponse.data) {
  //       confirmation.user = userResponse.data;
  //     }
  //   } catch (e) {
  //     console.error('Error cargando datos del usuario:', e);
  //   }
  // }
  // Generar QR
  let qrDataUrl: string | null = null;
  try {
    const payload = JSON.stringify({ 
      orderId: confirmation.id, 
      total: confirmation.totalAmount,
      date: confirmation.purchaseDate,
      items: confirmation.orderItems?.length || 0,
    });
    qrDataUrl = await QRCode.toDataURL(payload, {
      width: 512,
      margin: 2,
      color: {
        dark: '#141113',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (e) {
    console.error('Error generando QR:', e);
  }
  const COLORS = {
    primary: { r: 187, g: 34, b: 40 },
    primaryDark: { r: 92, g: 18, b: 20 },
    textDefault: { r: 57, g: 58, b: 58 },
    textStrong: { r: 20, g: 17, b: 19 },
    bgLight: { r: 239, g: 239, b: 238 },
  };

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // HEADER
  const headerHeight = 100;
  pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  const qrSize = 80;
  const qrX = pageWidth - margin - qrSize;
  const qrY = (headerHeight - qrSize) / 2;
  if (qrDataUrl) {
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  const logoSize = qrSize * 0.8;
  const logoY = (headerHeight - logoSize) / 2;
  try {
    pdf.addImage(LOGO_URL, 'PNG', margin, logoY, logoSize, logoSize);
  } catch (e) {
    console.error('Error cargando logo:', e);
  }

  const textX = margin + logoSize + 12;
  const textCenterY = headerHeight / 2;
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CINEPLUS', textX, textCenterY - 5);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Tu experiencia cinematográfica premium', textX, textCenterY + 10);

  y = headerHeight + 20;

  const isFactura = confirmation.invoiceType === 'FACTURA';
  const comprobanteType = isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';

  pdf.setTextColor(COLORS.textStrong.r, COLORS.textStrong.g, COLORS.textStrong.b);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(comprobanteType, pageWidth / 2, y, { align: 'center' });

  y += 25;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  // Comentado: manejo seguro de undefined en la fecha
  const fecha = (confirmation.orderDate || confirmation.createdAt)
    ? new Date(confirmation.orderDate || confirmation.createdAt || new Date()).toLocaleString('es-PE', {
        dateStyle: 'long',
        timeStyle: 'short'
      })
    : new Date().toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
  pdf.text('N° Orden:', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
  pdf.text(`${confirmation.id}`, margin + 70, y);

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
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
  pdf.text(isFactura ? 'Cliente:' : 'Comprador:', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
  
  // Log para debugging
  console.log('Usuario en PDF:', confirmation.user);
  
  if (isFactura) {
    const razonSocial = confirmation.user?.razonSocial || 'N/A';
    const ruc = confirmation.user?.ruc || 'N/A';
    pdf.text(`${razonSocial} - RUC: ${ruc}`, margin + 80, y);
  } else {
    const firstName = confirmation.user?.firstName || '';
    const lastName = confirmation.user?.lastName || '';
    const nombre = [firstName, lastName].filter(Boolean).join(' ').trim() || confirmation.user?.username || 'N/A';
    const dni = confirmation.user?.nationalId || 'N/A';
    
    console.log('Comprador BOLETA:', { firstName, lastName, nombre, dni });
    
    pdf.text(`${nombre}`, margin + 80, y);
    y += 12;
    pdf.text(`DNI: ${dni}`, margin + 80, y);
  }

  y += 20;
  pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.setLineWidth(1.5);
  pdf.line(margin, y, pageWidth - margin, y);

  y += 20;
  const imageX = pageWidth - margin - 70;
  const imageY = y;
  const imageSize = 80;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text('PELÍCULA Y FUNCIÓN', margin, y);

  y += 18;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
  pdf.text('Película:', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
  const movieTitle = confirmation.orderItems?.[0]?.movie?.title || confirmation.movie?.title || confirmation.orderItems?.[0]?.showtime?.movieTitle || 'Película N/A';
  const movieWrapped = pdf.splitTextToSize(movieTitle, imageX - margin - 15);
  pdf.text(movieWrapped, margin + 70, y);
  y += movieWrapped.length > 1 ? 15 : 12;

  const cinemaName = confirmation.orderItems?.[0]?.showtime?.cinemaName || 'N/A';
  const theaterName = confirmation.orderItems?.[0]?.showtime?.theaterName || 'N/A';
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
  pdf.text('Cine:', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
  pdf.text(`${cinemaName} - Sala ${theaterName}`, margin + 70, y);
  y += 12;

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

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
  pdf.text('Duración:', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
  const duration = confirmation.orderItems?.[0]?.movie?.duration || confirmation.movie?.duration;
  const durationText = duration ? `${duration} min` : 'N/A';
  pdf.text(durationText, margin + 70, y);
  y += 12;

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
  pdf.text('Horario:', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
  const showtime = confirmation.orderItems?.[0]?.showtime?.time || 'N/A';
  const showtimeDate = confirmation.orderItems?.[0]?.showtime?.date || 'N/A';
  const horariFull = `${showtimeDate} ${showtime}`;
  pdf.text(horariFull, margin + 70, y);

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

  y += 20;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text('ENTRADAS DE CINE', margin, y);

  y += 15;
  pdf.setFontSize(9);

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

      console.log(`Entrada ${idx}:`, {
        ticketType: item.ticketType,
        ticketTypeName,
        seatCode,
        seatType,
        price: item.price,
      });

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

  pdf.setLineWidth(0.5);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, y, pageWidth - margin, y);

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

  pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
  pdf.text('Subtotal Entradas:', margin, y);
  pdf.text(`S/ ${ticketsSubtotal.toFixed(2)}`, rightCol, y, { align: 'right' });
  y += 12;

  pdf.text('Subtotal Dulcería:', margin, y);
  pdf.text(`S/ ${concessionsSubtotal.toFixed(2)}`, rightCol, y, { align: 'right' });
  y += 12;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Subtotal:', margin, y);
  pdf.text(`S/ ${subtotalBeforeTax.toFixed(2)}`, rightCol, y, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  y += 12;

  const fidelityDiscount = confirmation.fidelityDiscountAmount || 0;
  
  // LÓGICA DE DESCUENTOS:
  // 1. Si hay promotion (con promotion_id), mostrar descuento de promoción
  // 2. Si NO hay promotion pero hay fidelityDiscountAmount, mostrar descuento de fidelización
  // 3. Si no hay ninguno, no mostrar descuentos
  
  console.log('Descuentos en PDF:', {
    hasPromotion: !!confirmation.promotion,
    promotion: confirmation.promotion,
    fidelityDiscount,
  });
  
  // Mostrar descuento por promoción (si existe promotion_id)
  if (confirmation.promotion && confirmation.promotion.id) {
    const promotionCode = confirmation.promotion.code || 'PROMOCIÓN APLICADA';
    const promotionValue = confirmation.promotion.value || confirmation.promotion.discountAmount || 0;
    
    if (promotionValue > 0) {
      pdf.setTextColor(34, 197, 94); // Verde para descuento
      pdf.text(`Descuento (${promotionCode})`, margin, y);
      pdf.text(`- S/ ${promotionValue.toFixed(2)}`, rightCol, y, { align: 'right' });
      pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
      y += 12;
    }
  } 
  // Si NO hay promoción pero hay descuento por fidelización
  else if (fidelityDiscount > 0) {
    pdf.setTextColor(34, 197, 94); // Verde para descuento
    pdf.text('Descuento Fidelización', margin, y);
    pdf.text(`- S/ ${fidelityDiscount.toFixed(2)}`, rightCol, y, { align: 'right' });
    pdf.setTextColor(COLORS.textDefault.r, COLORS.textDefault.g, COLORS.textDefault.b);
    y += 12;
  }
  // Si no hay promoción ni fidelización, no mostrar descuentos

  pdf.text('IGV (18%):', margin, y);
  pdf.text(`S/ ${igv.toFixed(2)}`, rightCol, y, { align: 'right' });
  y += 15;

  pdf.setLineWidth(1);
  pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 15;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text('TOTAL A PAGAR:', margin, y);
  pdf.setFontSize(16);
  pdf.text(`S/ ${total.toFixed(2)}`, rightCol, y, { align: 'right' });

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
};
