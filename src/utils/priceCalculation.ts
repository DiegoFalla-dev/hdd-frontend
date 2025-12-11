/**
 * UTILIDAD CENTRALIZADA DE CÁLCULO DE PRECIOS
 * 
 * Esta utilidad se usa en todo el sistema para garantizar consistencia
 * en el cálculo de subtotales, descuentos e IGV (18%)
 * 
 * Flujo:
 * 1. Subtotal = suma de precios de entradas + productos
 * 2. Descuento = aplicar promoción al subtotal (si aplica)
 * 3. Base imponible = Subtotal - Descuento
 * 4. IGV (18%) = Base imponible * 0.18
 * 5. Total = Base imponible + IGV
 */

export const IGV_RATE = 0.18; // 18% de impuesto general a la venta

/**
 * Interfaz de salida del cálculo de precios
 */
export interface PriceBreakdown {
  subtotal: number;           // Suma de precios de artículos (sin descuentos ni impuestos)
  discountAmount: number;      // Monto total de descuento
  subtotalAfterDiscount: number; // Subtotal - Descuento (base imponible)
  taxAmount: number;           // IGV calculado (18% sobre base imponible)
  grandTotal: number;          // Subtotal - Descuento + IGV
}

/**
 * Calcula el desglose de precios completo
 * @param subtotal - Suma de todos los precios de artículos
 * @param discountAmount - Monto del descuento (puede ser 0)
 * @returns PriceBreakdown con todos los cálculos
 */
export function calculatePriceBreakdown(
  subtotal: number,
  discountAmount: number = 0
): PriceBreakdown {
  // Asegurar valores numéricos válidos
  const cleanSubtotal = Math.max(0, Number(subtotal) || 0);
  const cleanDiscount = Math.max(0, Number(discountAmount) || 0);
  
  // Base imponible: subtotal menos descuentos
  const subtotalAfterDiscount = Math.max(0, cleanSubtotal - cleanDiscount);
  
  // IGV: 18% sobre la base imponible
  const taxAmount = parseFloat((subtotalAfterDiscount * IGV_RATE).toFixed(2));
  
  // Total: base imponible + IGV
  const grandTotal = parseFloat((subtotalAfterDiscount + taxAmount).toFixed(2));
  
  return {
    subtotal: parseFloat(cleanSubtotal.toFixed(2)),
    discountAmount: parseFloat(cleanDiscount.toFixed(2)),
    subtotalAfterDiscount: parseFloat(subtotalAfterDiscount.toFixed(2)),
    taxAmount,
    grandTotal,
  };
}

/**
 * Calcula solo el monto de IGV
 */
export function calculateTax(base: number): number {
  const cleanBase = Math.max(0, Number(base) || 0);
  return parseFloat((cleanBase * IGV_RATE).toFixed(2));
}

/**
 * Calcula el total (base + IGV)
 */
export function calculateGrandTotal(subtotal: number, discountAmount: number = 0): number {
  const breakdown = calculatePriceBreakdown(subtotal, discountAmount);
  return breakdown.grandTotal;
}

/**
 * Redondea un número a 2 decimales
 */
export function roundToTwoDecimals(value: number): number {
  return parseFloat((Math.round(value * 100) / 100).toFixed(2));
}
