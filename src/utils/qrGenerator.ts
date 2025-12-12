import QRCode from 'qrcode';

// Utilidad para generar un QR (ejemplo):
export const generateQrCode = async (text: string): Promise<string | null> => {
  try {
    return await QRCode.toDataURL(text);
  } catch (error) {
    console.error('Error generando QR:', error);
    return null;
  }
};
