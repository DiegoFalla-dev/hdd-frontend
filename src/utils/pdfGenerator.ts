import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { OrderSummary } from '../services/orderService';

// Colores de la paleta CINEPLUS
const COLORS = {
  primary: { r: 187, g: 34, b: 40 },      // #BB2228 - rojo brillante
  primaryDark: { r: 92, g: 18, b: 20 },   // #5C1214 - rojo oscuro
  gray700: { r: 57, g: 58, b: 58 },       // #393A3A
  gray900: { r: 20, g: 17, b: 19 },       // #141113
  bg100: { r: 239, g: 239, b: 238 },      // #EFEFEE
};

const LOGO_URL = 'https://i.imgur.com/K9o09F6.png';

export const generateOrderPDF = async (order: OrderSummary) => {
  try {
    // Generar QR code
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(`ORDER-${order.id}`, {
        width: 100,
        margin: 1,
      });
    } catch (err) {
      console.error('Error generando QR:', err);
    }

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;
    
    // HEADER - Fondo con color primario
    pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.rect(0, 0, pageWidth, 110, 'F');
    
    // Logo de la empresa
    try {
      pdf.addImage(LOGO_URL, 'PNG', margin, 15, 60, 60);
    } catch (e) {
      console.error('Error cargando logo:', e);
    }
    
    // Texto del header
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CINEPLUS', margin + 70, 40);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Tu experiencia cinematográfica premium', margin + 70, 58);
    
    // QR Code en header derecha
    if (qrDataUrl) {
      pdf.addImage(qrDataUrl, 'PNG', pageWidth - 120, 15, 95, 95);
    }
    
    y = 125;
    
    // INFORMACIÓN DE LA ORDEN
    pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPROBANTE DE PAGO', margin, y);
    
    y += 25;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Datos de la orden en dos columnas
    const fecha = new Date(order.purchaseDate).toLocaleString('es-PE', { 
      dateStyle: 'long', 
      timeStyle: 'short' 
    });
    
    // Primera columna
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('N° Orden:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    pdf.text(`${order.id}`, margin + 70, y);
    
    // Segunda columna
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('Estado:', pageWidth / 2 + 20, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    pdf.text(order.status, pageWidth / 2 + 90, y);
    
    y += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('Fecha:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    pdf.text(fecha, margin + 70, y);
    
    y += 20;
    pdf.setDrawColor(187, 34, 40); // Color primario para líneas
    pdf.setLineWidth(1.5);
    pdf.line(margin, y, pageWidth - margin, y);
    
    // DATOS DE LA PELÍCULA
    y += 20;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text('PELÍCULA Y FUNCIÓN', margin, y);
    
    y += 18;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('Película:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    const movieTitleWrapped = pdf.splitTextToSize(order.movieTitle || 'N/A', pageWidth - 2 * margin - 70);
    pdf.text(movieTitleWrapped, margin + 70, y);
    y += movieTitleWrapped.length > 1 ? 15 : 12;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('Cine:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    pdf.text(order.cinemaName || 'N/A', margin + 70, y);
    
    y += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('Sala:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    pdf.text(order.roomName || 'N/A', margin + 70, y);
    
    y += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('Función:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    const funcionFecha = new Date(order.showtimeDate || order.purchaseDate).toLocaleString('es-PE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const funcionWrapped = pdf.splitTextToSize(funcionFecha, pageWidth - 2 * margin - 70);
    pdf.text(funcionWrapped, margin + 70, y);
    y += funcionWrapped.length > 1 ? 15 : 12;
    
    y += 10;
    pdf.setDrawColor(187, 34, 40);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);
    
    // SECCIÓN DE ENTRADAS
    y += 20;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text('ENTRADAS', margin, y);
    
    y += 15;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    if (order.orderItems && order.orderItems.length > 0) {
      order.orderItems.forEach((item, idx) => {
        const seatCode = item.seat?.code || item.seat?.id || 'N/A';
        pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
        pdf.text(`${idx + 1}. Asiento: ${seatCode}`, margin, y);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
        pdf.text(`S/ ${item.price?.toFixed(2) || '0.00'}`, pageWidth - margin - 60, y, { align: 'right' });
        y += 12;
      });
    } else {
      pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
      pdf.text('Sin entradas registradas', margin, y);
      y += 12;
    }
    
    y += 5;
    
    // SECCIÓN DE CONCESIONES (Dulcería)
    if (order.orderConcessions && order.orderConcessions.length > 0) {
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
      
      order.orderConcessions.forEach((concession, idx) => {
        pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
        pdf.text(`${idx + 1}. ${concession.productName}`, margin, y);
        pdf.text(`x${concession.quantity}`, margin + 180, y);
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
    const total = order.totalAmount;
    const subtotalBeforeTax = total / 1.18;
    const igv = total - subtotalBeforeTax;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    
    const rightCol = pageWidth - margin - 100;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('Subtotal:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    pdf.text(`S/ ${subtotalBeforeTax.toFixed(2)}`, rightCol, y, { align: 'right' });
    
    y += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primaryDark.r, COLORS.primaryDark.g, COLORS.primaryDark.b);
    pdf.text('IGV (18%):', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    pdf.text(`S/ ${igv.toFixed(2)}`, rightCol, y, { align: 'right' });
    
    y += 18;
    pdf.setLineWidth(2);
    pdf.setDrawColor(187, 34, 40);
    pdf.line(rightCol - 95, y, rightCol, y);
    
    y += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text('TOTAL PAGADO:', margin, y);
    pdf.setFontSize(16);
    pdf.text(`S/ ${total.toFixed(2)}`, rightCol, y, { align: 'right' });
    
    // FOOTER
    y = pageHeight - 80;
    pdf.setFillColor(COLORS.bg100.r, COLORS.bg100.g, COLORS.bg100.b);
    pdf.rect(0, y - 10, pageWidth, 80, 'F');
    
    y += 10;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    pdf.text('Gracias por tu compra en CINEPLUS', pageWidth / 2, y, { align: 'center' });
    
    y += 12;
    pdf.setFontSize(8);
    pdf.text('www.cineplus.com | atencionalcliente@cineplus.com | (01) 555-CINE', pageWidth / 2, y, { align: 'center' });
    
    y += 10;
    pdf.text('Presenta este comprobante en taquilla para recoger tus entradas', pageWidth / 2, y, { align: 'center' });
    
    pdf.save(`comprobante_orden_${order.id}.pdf`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};
