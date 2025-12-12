import QRCode from 'qrcode';
<<<<<<< HEAD

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
=======
import type { OrderDTO } from '../services/orderService';

/**
 * Genera un código QR en formato DataURL para una orden
 * @param order Datos de la orden
 * @returns Promise con la URL del QR en formato PNG
 */
export const generateOrderQR = async (order: OrderDTO): Promise<string | null> => {
  try {
    const payload = JSON.stringify({
      orderId: order.id,
      total: order.totalAmount,
      date: order.purchaseDate || new Date().toISOString(),
      items: order.orderItems?.length || 0,
    });

    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 512,
      margin: 2,
      color: {
        dark: '#141113',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
>>>>>>> f36d5c719808a96ef31ee35c5386be6a390c0321

    return qrDataUrl;
  } catch (error) {
    console.error('Error generando QR:', error);
    return null;
  }
};

/**
 * Función auxiliar comentada para obtener nombres de tipos de entrada
 * const getTicketTypeName = (ticketTypeStr: string | undefined): string => {
 *   const ticketTypeMapping: Record<string, string> = {
 *     'ticket-1': 'PROMO ONLINE',
 *     'ticket-2': 'Silla de ruedas',
 *     'ticket-3': '50% DCTO BANCO RIPLEY',
 *     'ticket-4': 'Persona con discapacidad',
 *     'ticket-5': 'Niño',
 *     'ticket-6': 'Adulto',
 *   };
 *   if (!ticketTypeStr) return 'Regular';
 *   if (typeof ticketTypeStr === 'object') return ticketTypeStr.name || ticketTypeStr.code || 'Regular';
 *   if (ticketTypeMapping[ticketTypeStr]) {
 *     return ticketTypeMapping[ticketTypeStr];
 *   }
 *   return ticketTypeStr || 'Regular';
 * };
 */
