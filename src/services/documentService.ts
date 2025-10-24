import api from './apiClient';

class DocumentService {
  async getInvoicePdf(orderId: number): Promise<Blob> {
    try {
      const response = await api.get(`/orders/${orderId}/invoice-pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice PDF:', error);
      throw error;
    }
  }

  async getTicketQr(itemId: number): Promise<Blob> {
    try {
      const response = await api.get(`/orders/items/${itemId}/qr-code`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket QR:', error);
      throw error;
    }
  }

  async getTicketPdf(itemId: number): Promise<Blob> {
    try {
      const response = await api.get(`/orders/items/${itemId}/ticket-pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket PDF:', error);
      throw error;
    }
  }

  // Utilidad para descargar archivos
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Métodos de conveniencia que manejan la descarga directamente
  async downloadInvoicePdf(orderId: number, filename = 'invoice.pdf') {
    const blob = await this.getInvoicePdf(orderId);
    this.downloadBlob(blob, filename);
  }

  async downloadTicketQr(itemId: number, filename = 'ticket-qr.png') {
    const blob = await this.getTicketQr(itemId);
    this.downloadBlob(blob, filename);
  }

  async downloadTicketPdf(itemId: number, filename = 'ticket.pdf') {
    const blob = await this.getTicketPdf(itemId);
    this.downloadBlob(blob, filename);
  }
}

export const documentService = new DocumentService();
export default documentService;