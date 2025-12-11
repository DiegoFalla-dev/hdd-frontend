// useInvoice.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/apiClient';

export interface InvoiceData {
  invoiceNumber: string;
  orderId: number;
  amount: number;
  date: string;
  customer: string;
}

export function useInvoice(invoiceNumber?: string) {
  /**
   * Descarga el PDF de la factura
   */
  const downloadInvoiceMutation = useMutation({
    mutationFn: async (inv: string) => {
      try {
        const response = await api.get(`/api/invoices/${inv}/pdf`, {
          responseType: 'blob',
        });

        // Crear blob y descargar
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `factura_${inv}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, invoiceNumber: inv };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error al descargar factura';
        throw new Error(errorMsg);
      }
    },
  });

  /**
   * Obtiene datos de la factura
   */
  const invoiceQuery = useQuery({
    queryKey: ['invoice', invoiceNumber],
    queryFn: async () => {
      if (!invoiceNumber) return null;
      try {
        const response = await api.get<InvoiceData>(`/api/invoices/${invoiceNumber}`);
        return response.data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error al obtener factura';
        throw new Error(errorMsg);
      }
    },
    enabled: !!invoiceNumber,
  });

  /**
   * Obtiene todas las facturas del usuario
   */
  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        const response = await api.get<InvoiceData[]>('/api/invoices/my-invoices');
        return response.data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error al obtener facturas';
        throw new Error(errorMsg);
      }
    },
  });

  return {
    // Datos
    invoice: invoiceQuery.data,
    invoices: invoicesQuery.data,
    
    // Estados
    isLoading: invoiceQuery.isLoading || invoicesQuery.isLoading,
    isDownloading: downloadInvoiceMutation.isPending,
    error: invoiceQuery.error || invoicesQuery.error || downloadInvoiceMutation.error,
    
    // Acciones
    downloadInvoice: downloadInvoiceMutation.mutateAsync,
    refetch: invoiceQuery.refetch,
    refetchAll: invoicesQuery.refetch,
  };
}

/**
 * Hook para enviar factura por email
 */
export function useEmailInvoice() {
  const emailMutation = useMutation({
    mutationFn: async (invoiceNumber: string) => {
      try {
        const response = await api.post(`/api/invoices/${invoiceNumber}/send-email`, {});
        return response.data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error al enviar factura por email';
        throw new Error(errorMsg);
      }
    },
  });

  return {
    sendInvoice: emailMutation.mutateAsync,
    isSending: emailMutation.isPending,
    error: emailMutation.error,
  };
}
