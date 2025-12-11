import QRCode from 'qrcode';

/**
 * Configuración optimizada para generar códigos QR de alta calidad
 */
export interface QRCodeOptions {
  /** Tamaño en píxeles (default: 512 para impresión) */
  size?: number;
  /** Nivel de corrección de errores: 'L' (7%), 'M' (15%), 'Q' (25%), 'H' (30%) */
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  /** Margen alrededor del QR (default: 2) */
  margin?: number;
}

/**
 * Genera un código QR optimizado para impresión
 * @param data - Datos a codificar (objeto se convierte a JSON)
 * @param options - Opciones de configuración
 * @returns Data URL del QR code
 */
export async function generateHighQualityQR(
  data: string | object,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    size = 512,
    errorCorrection = 'H',
    margin = 2,
  } = options;

  const payload = typeof data === 'string' ? data : JSON.stringify(data);

  return QRCode.toDataURL(payload, {
    width: size,
    margin,
    color: {
      dark: '#141113', // Negro CINEPLUS
      light: '#FFFFFF',
    },
    errorCorrectionLevel: errorCorrection,
  });
}

/**
 * Genera un QR para display web (menor resolución)
 */
export async function generateDisplayQR(data: string | object): Promise<string> {
  return generateHighQualityQR(data, {
    size: 256,
    errorCorrection: 'M',
    margin: 1,
  });
}

/**
 * Genera un QR para impresión física (máxima calidad)
 */
export async function generatePrintQR(data: string | object): Promise<string> {
  return generateHighQualityQR(data, {
    size: 1024, // 1024px para impresión nítida
    errorCorrection: 'H',
    margin: 2,
  });
}

/**
 * Valida que los datos puedan ser codificados en un QR
 * QR codes tienen límites según el nivel de corrección
 */
export function validateQRData(data: string | object): {
  isValid: boolean;
  byteLength: number;
  maxBytes: number;
  error?: string;
} {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const byteLength = new TextEncoder().encode(payload).length;
  
  // Límites aproximados para QR con corrección H
  const MAX_BYTES_H = 1273; // Version 40 con error correction H
  
  if (byteLength > MAX_BYTES_H) {
    return {
      isValid: false,
      byteLength,
      maxBytes: MAX_BYTES_H,
      error: `Datos demasiado largos: ${byteLength} bytes (máximo ${MAX_BYTES_H})`,
    };
  }
  
  return {
    isValid: true,
    byteLength,
    maxBytes: MAX_BYTES_H,
  };
}

/**
 * Crea el payload estándar para QR de órdenes de CINEPLUS
 */
export function createOrderQRPayload(order: {
  id: number;
  totalAmount: number;
  purchaseDate: string;
  itemCount?: number;
}) {
  return {
    type: 'CINEPLUS_ORDER',
    orderId: order.id,
    total: order.totalAmount,
    date: order.purchaseDate,
    items: order.itemCount || 0,
    version: '1.0',
  };
}
