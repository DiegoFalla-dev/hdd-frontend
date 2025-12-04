import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useToast } from '../components/ToastProvider';
import { useSeatSelectionStore } from '../store/seatSelectionStore';
import { useQueryClient } from '@tanstack/react-query';
import { useOrderPreview } from '../hooks/useOrderPreview';
import { useOrderConfirm } from '../hooks/useOrderConfirm';
import { usePromotionValidation } from '../hooks/usePromotionValidation';
import { getProductById } from '../services/concessionService';
import { getShowtimes } from '../services/showtimeService';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import paymentMethodService from '../services/paymentMethodService';
import { useSeats } from '../hooks/useSeats';
import type { Seat } from '../types/Seat';
import type { CreateOrderItemDTO } from '../services/orderService';
// OrderConfirmation type not used here

const CarritoTotal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const cartSnapshot = useCartStore(s => s.cartSnapshot());
  const setTicketGroup = useCartStore(s => s.setTicketGroup);
  const addConcession = useCartStore(s => s.addConcession);
  const clearCart = useCartStore(s => s.clearCart);
  const toast = useToast();
  const seatSelectionStore = useSeatSelectionStore();
  const queryClient = useQueryClient();
  const orderPreviewQuery = useOrderPreview(true);
  const orderConfirmMutation = useOrderConfirm();
  const { validate: validatePromotion, isLoading: promoLoading, promotion, error: promoError } = usePromotionValidation();
  // const applyPromotion = useCartStore(s => s.applyPromotion);
  const clearPromotion = useCartStore(s => s.clearPromotion);
  const [promoCode, setPromoCode] = useState('');

  // Seleccionar automáticamente el método de pago predeterminado
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethodId) {
      const defaultMethod = paymentMethods.find(pm => pm.isDefault || pm.default);
      setSelectedPaymentMethodId(defaultMethod?.id || paymentMethods[0].id);
    } else if (paymentMethods && paymentMethods.length === 0 && !showAddPaymentForm) {
      // Si no hay métodos de pago, mostrar el formulario automáticamente
      setShowAddPaymentForm(true);
    }
  }, [paymentMethods, selectedPaymentMethodId, showAddPaymentForm]);

  const preview = orderPreviewQuery.data;
    // Prefetch del preview cuando se modifica el carrito (optimiza recalculo)
    // Asumiendo que cartSnapshot() cambia referencia en cada modificación
    // Solo ejecuta si hay al menos un grupo de tickets o concesiones
    React.useEffect(() => {
      if (cartSnapshot.ticketGroups.length || cartSnapshot.concessions.length) {
        // ya lo obtiene useOrderPreview, pero un prefetch permite cache inicial antes de render pesado
        // Podría hacerse con queryClient.prefetchQuery si se necesitara acceso directo.
      }
    }, [cartSnapshot]);
  const previewLoading = orderPreviewQuery.isLoading;
  const previewError = orderPreviewQuery.isError;

  // If a pendingOrder exists in localStorage, hydrate the cartStore so preview can calculate totals
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pendingOrder');
      if (!raw) return;
      const pending = JSON.parse(raw);
      console.debug('CarritoTotal hydrate pendingOrder', pending);
      if (!pending) return;
      // If cart already has ticketGroups, assume hydrated
      if ((cartSnapshot.ticketGroups || []).length > 0 || (cartSnapshot.concessions || []).length > 0) return;
      // Clear any previous cart
      clearCart();
      if (pending.showtimeId && pending.seats && pending.seats.length) {
        // Calculate average price from selected ticket types (entradas)
        let averagePrice = 0;
        if (pending.entradas && Array.isArray(pending.entradas) && pending.entradas.length > 0) {
          const totalPrice = pending.entradas.reduce((sum: number, e: any) => sum + (e.precio * e.cantidad), 0);
          const totalQuantity = pending.entradas.reduce((sum: number, e: any) => sum + e.cantidad, 0);
          averagePrice = totalQuantity > 0 ? totalPrice / totalQuantity : 0;
          console.log('📊 Precio calculado de entradas:', { 
            entradas: pending.entradas, 
            totalPrice, 
            totalQuantity, 
            averagePrice,
            seats: pending.seats.length
          });
        } else {
          console.warn('⚠️ No hay entradas en pendingOrder:', pending);
        }
        
        const initialPrice = averagePrice > 0 ? averagePrice : (pending.pricePerSeat || 0);
        
        if (initialPrice && initialPrice > 0) {
          setTicketGroup(pending.showtimeId, pending.seats, initialPrice);
          console.log('✅ Ticket group guardado con precio:', initialPrice);
          
          // Log del snapshot después de guardar
          setTimeout(() => {
            const currentSnapshot = useCartStore.getState().cartSnapshot();
            console.log('📦 Cart snapshot después de hidratar:', {
              ticketGroups: currentSnapshot.ticketGroups,
              ticketsSubtotal: currentSnapshot.ticketsSubtotal,
              concessions: currentSnapshot.concessions,
              concessionsSubtotal: currentSnapshot.concessionsSubtotal
            });
          }, 100);

          // ensure seat selection store knows about this showtime and session
          try {
            if (pending.sessionId) {
              // initialize selection for this showtime (creates selection if missing)
              seatSelectionStore.setCurrentShowtime(Number(pending.showtimeId));
              // attach sessionId so payment page can read it from seatSelectionStore
              seatSelectionStore.attachSession(Number(pending.showtimeId), pending.sessionId, pending.expiresInMs);
              console.debug('Attached session from pendingOrder to seatSelectionStore', { showtimeId: pending.showtimeId, sessionId: pending.sessionId });
            } else {
              console.debug('pendingOrder has no sessionId', { showtimeId: pending.showtimeId });
            }
            console.debug('seatSelectionStore.selections after hydrate', useSeatSelectionStore.getState().selections);
          } catch (err) {
            // non-fatal
            console.warn('Could not attach session to seatSelectionStore', err);
          }
        } else if (pending.movieId && pending.cinemaId && pending.date) {
          // Try to revalidate price from backend (non-blocking)
          getShowtimes({ movieId: Number(pending.movieId), cinemaId: Number(pending.cinemaId), date: pending.date })
            .then((sts: any[]) => {
              const found = sts.find((s: any) => Number(s.id) === Number(pending.showtimeId));
              const price = found && typeof found.price === 'number' && found.price > 0 ? found.price : 0;
              setTicketGroup(pending.showtimeId, pending.seats, price || 0);
            })
            .catch(() => {
              setTicketGroup(pending.showtimeId, pending.seats, 0);
            });
        } else {
          setTicketGroup(pending.showtimeId, pending.seats, 0);
        }
      }
      if (pending.concessions && Array.isArray(pending.concessions) && pending.concessions.length) {
        // pending.concessions may be stored as cartStore items or raw (productId, quantity)
        // Enrich concessions by fetching product details from backend when missing
        (async () => {
          try {
            const ids = pending.concessions.map((c: any) => c.productId).filter((v: any): v is number => typeof v === 'number');
            const uniqIds: number[] = Array.from(new Set<number>(ids));
            const productFetches = uniqIds.map((id: number) => getProductById(id).then(p => ({ id, product: p })).catch(() => ({ id, product: null })));
            const fetched = await Promise.all(productFetches);
            const map = new Map<number, any>();
            fetched.forEach((r: any) => { if (r && r.id) map.set(r.id, r.product); });

            pending.concessions.forEach((c: any) => {
              if (c.productId && c.quantity) {
                const prod = map.get(c.productId) || null;
                const item = prod ?
                  { id: prod.id, name: prod.name || c.name || 'Producto', description: prod.description || c.description || '', price: prod.price || c.unitPrice || c.price || 0, imageUrl: prod.imageUrl || '', category: (prod.category || 'SNACKS') as any }
                  : { id: c.productId, name: c.name || 'Producto', description: c.description || '', price: c.unitPrice || c.price || 0, imageUrl: '', category: 'SNACKS' as any };
                addConcession(item as any, c.quantity);
              }
            });
          } catch (err) {
            // Fallback: add minimal concessions
            pending.concessions.forEach((c: any) => {
              if (c.productId && c.quantity) {
                addConcession({ id: c.productId, name: c.name || 'Producto', description: c.description || '', price: c.unitPrice || c.price || 0, imageUrl: '', category: 'SNACKS' as any } as any, c.quantity);
              }
            });
          }
        })();
      }
    } catch (e) {
      console.warn('Could not hydrate cart from pendingOrder', e);
    }
  }, []);

  const validateCard = () => {
    // Si hay un método de pago seleccionado, no validar el formulario
    if (selectedPaymentMethodId) {
      return true;
    }
    
    // Si el formulario de nuevo método está visible, validar sus campos
    if (showAddPaymentForm) {
      const cc = cardNumber.replace(/\D/g, '');
      if (cc.length < 12 || cc.length > 19) return false;
      if (!cvv || !/^[0-9]{3,4}$/.test(cvv)) return false;
      if (!expiry || !/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(expiry)) return false;
      if (!cardName || cardName.trim().length < 3) return false;
      return true;
    }
    
    // Si no hay método seleccionado ni formulario visible, no es válido
    return false;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCard()) {
      toast.warning('Revisa los datos de la tarjeta');
      return;
    }

    setIsProcessing(true);
    // Construcción avanzada del payload de pago (mantiene compatibilidad con estructura legacy)
    const paymentItems = cartSnapshot.paymentItems;
    // debug: dump key state before building session map
    try {
      console.debug('Payment submit debug', { cartSnapshot, paymentItems, seatSelections: useSeatSelectionStore.getState().selections, pendingOrder: (() => { try { return JSON.parse(localStorage.getItem('pendingOrder') || 'null'); } catch { return null; } })() });
    } catch {}
    const ticketShowtimeIds = Array.from(new Set(paymentItems.filter(i => i.type === 'TICKET').map(i => i.showtimeId)));
    const sessionMap: Record<number, string> = {};
    let missingSession = false;
    for (const stId of ticketShowtimeIds) {
      const sessionId = seatSelectionStore.selections[stId]?.sessionId;
      if (sessionId) {
        sessionMap[stId] = sessionId;
      } else {
        missingSession = true;
      }
    }

    if (missingSession) {
      // Attempt to rescue sessionId from pendingOrder (fallback)
      try {
        const rawPending = localStorage.getItem('pendingOrder');
        if (rawPending) {
          const pending = JSON.parse(rawPending);
          if (pending && pending.showtimeId && pending.sessionId) {
            // attach to store and to sessionMap
            const st = Number(pending.showtimeId);
            try {
              seatSelectionStore.setCurrentShowtime(st);
              seatSelectionStore.attachSession(st, pending.sessionId, pending.expiresInMs);
              sessionMap[st] = pending.sessionId;
            } catch (err) {
              console.warn('Could not attach pending sessionId during payment fallback', err);
            }
          }
        }
      } catch (err) {
        console.warn('Error reading pendingOrder for fallback', err);
      }

      // Re-evaluate missingSession after attempting fallback
      missingSession = false;
      for (const stId of ticketShowtimeIds) {
        const sessionId = seatSelectionStore.selections[stId]?.sessionId;
        if (sessionId) sessionMap[stId] = sessionId; else missingSession = true;
      }
      // Aggressive fallback: if still missing and there is a single showtime in the order,
      // and pendingOrder contains a sessionId, use it directly for that showtime.
      if (missingSession) {
        try {
          const rawPending2 = localStorage.getItem('pendingOrder');
          if (rawPending2) {
            const pending2 = JSON.parse(rawPending2);
            if (pending2 && pending2.sessionId && ticketShowtimeIds.length === 1) {
              const onlySt = ticketShowtimeIds[0];
              sessionMap[onlySt] = pending2.sessionId;
              missingSession = false;
              console.debug('Aggressive fallback: using pendingOrder.sessionId for showtime', { showtimeId: onlySt, sessionId: pending2.sessionId });
            }
          }
        } catch (err) {
          console.warn('Error during aggressive pendingOrder fallback', err);
        }
      }
    }

    // Validaciones de totales
    const itemsRawTotal = paymentItems.reduce((sum, it) => sum + it.totalPrice, 0);
    const discount = preview?.discountTotal || 0;
    const expectedGrand = preview?.grandTotal || 0;
    const computedGrand = Math.max(0, itemsRawTotal - discount);
    if (Math.abs(computedGrand - expectedGrand) > 0.01) {
      console.warn('Diferencia en grandTotal calculado vs preview', { computedGrand, expectedGrand });
    }

    interface PaymentPayloadItem {
      type: 'TICKET' | 'CONCESSION';
      showtimeId?: number;
      seatCode?: string;
      ticketType?: string;
      productId?: number;
      name?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }

    // Build mapping seatCode -> ticketType using pendingOrder.entradas grouping
    let seatTypeMap: Record<string, string | undefined> = {};
    try {
      const rawPending = localStorage.getItem('pendingOrder');
      if (rawPending) {
        const pending = JSON.parse(rawPending);
        const seats: string[] = pending.seats || [];
        const entradas: Array<{ id?: string; cantidad?: number }> = pending.entradas || [];
        let seatIndex = 0;
        for (const entrada of entradas) {
          const tipo = entrada.id || undefined;
          const qty = entrada.cantidad || 0;
          for (let i = 0; i < qty; i++) {
            if (seatIndex >= seats.length) break;
            seatTypeMap[seats[seatIndex]] = tipo;
            seatIndex++;
          }
        }
        // any remaining seats default to undefined
      }
    } catch (e) {
      console.warn('Could not read pendingOrder to map ticket types', e);
      seatTypeMap = {};
    }

    const items: PaymentPayloadItem[] = paymentItems.map(it => {
      if (it.type === 'TICKET') {
        return {
          type: 'TICKET',
          showtimeId: it.showtimeId,
          seatCode: it.seatCode,
          ticketType: it.seatCode ? seatTypeMap[it.seatCode] : undefined,
          quantity: 1,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        };
      }
      return {
        type: 'CONCESSION',
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      };
    });

    // Validar que el usuario esté autenticado
    if (!user || !user.id) {
      toast.error('Usuario no autenticado');
      setIsProcessing(false);
      return;
    }

    // Obtener o crear método de pago
    let paymentMethodId: number;
    
    // Si hay un método seleccionado, usarlo
    if (selectedPaymentMethodId) {
      paymentMethodId = selectedPaymentMethodId;
    } 
    // Si no hay método seleccionado pero el formulario está visible y completo, crear uno nuevo
    else if (showAddPaymentForm) {
      if (!cardNumber.trim() || !cardName.trim() || !expiry.trim() || !cvv.trim()) {
        toast.error('Por favor completa todos los datos de la tarjeta');
        setIsProcessing(false);
        return;
      }

      // Crear método de pago con los datos del formulario
      try {
        const newPaymentMethod = await paymentMethodService.createPaymentMethod({
          type: 'CARD',
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolder: cardName,
          expiry: expiry,
          cvv: cvv,
          isDefault: paymentMethods.length === 0, // Si es el primer método, hacerlo predeterminado
        });
        paymentMethodId = newPaymentMethod.id;
        toast.success('Método de pago registrado');
        // Invalidar la query para actualizar la lista
        queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
        // Limpiar formulario y ocultarlo
        setCardNumber('');
        setCardName('');
        setExpiry('');
        setCvv('');
        setShowAddPaymentForm(false);
        setSelectedPaymentMethodId(paymentMethodId);
      } catch (error) {
        console.error('Error creando método de pago', error);
        toast.error('Error al registrar el método de pago. Verifica los datos.');
        setIsProcessing(false);
        return;
      }
    } else {
      toast.error('Por favor selecciona o agrega un método de pago');
      setIsProcessing(false);
      return;
    }

    // Obtener todos los showtimeIds únicos de los tickets
    const ticketShowtimeIdsForSeats = Array.from(
      new Set(
        paymentItems
          .filter(it => it.type === 'TICKET')
          .map(it => it.showtimeId)
      )
    );

    // Obtener datos de asientos para mapear seatCode -> seatId
    let seatCodeToIdMap: Record<string, number> = {};
    try {
      // Fetch seats for all showtimes
      const seatsPromises = ticketShowtimeIdsForSeats.map(async (showtimeId) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/showtimes/${showtimeId}/seats`);
        if (!response.ok) throw new Error(`Failed to fetch seats for showtime ${showtimeId}`);
        const seats: Seat[] = await response.json();
        return seats;
      });
      
      const allSeatsArrays = await Promise.all(seatsPromises);
      const allSeats = allSeatsArrays.flat();
      
      // Crear mapa de seatCode (e.g., "A5") a seatId
      allSeats.forEach(seat => {
        const code = `${seat.row}${seat.number}`;
        seatCodeToIdMap[code] = seat.id;
      });
    } catch (error) {
      console.error('Error obteniendo datos de asientos', error);
      toast.error('Error al obtener información de asientos');
      setIsProcessing(false);
      return;
    }

    // Obtener las entradas seleccionadas del pendingOrder para asignar precios correctos
    let selectedEntradas: any[] = [];
    try {
      const pendingOrderRaw = localStorage.getItem('pendingOrder');
      if (pendingOrderRaw) {
        const pendingOrder = JSON.parse(pendingOrderRaw);
        selectedEntradas = pendingOrder.entradas || [];
      }
    } catch (e) {
      console.warn('No se pudieron obtener las entradas del pendingOrder', e);
    }

    // Expandir entradas a lista de precios individuales
    const ticketPrices: number[] = [];
    selectedEntradas.forEach((entrada: any) => {
      for (let i = 0; i < entrada.cantidad; i++) {
        ticketPrices.push(entrada.precio);
      }
    });

    // Construir items en el formato esperado por el backend (solo TICKETS)
    // El backend actual solo soporta tickets, no concesiones
    const orderItems: CreateOrderItemDTO[] = paymentItems
      .filter(it => it.type === 'TICKET')
      .map((it, index) => {
        const seatId = it.seatCode ? seatCodeToIdMap[it.seatCode] : undefined;
        
        if (!seatId) {
          throw new Error(`No se pudo encontrar el ID del asiento para el código: ${it.seatCode}`);
        }

        // Usar el precio de la entrada seleccionada correspondiente al índice del asiento
        // Si no hay precio disponible, usar el unitPrice del item o un default
        const price = ticketPrices[index] || it.unitPrice || 10.00;
        
        if (!ticketPrices[index]) {
          console.warn(`Seat ${it.seatCode} has no matched ticket price, using fallback: ${price}`);
        }

        return {
          showtimeId: it.showtimeId!,
          seatId: seatId,
          price: price,
          ticketType: it.seatCode ? seatTypeMap[it.seatCode] : undefined,
        };
      });

    if (orderItems.length === 0) {
      toast.error('No hay tickets válidos en la orden');
      setIsProcessing(false);
      return;
    }

    // Construir concesiones en el formato esperado por el backend
    const orderConcessions = paymentItems
      .filter(it => it.type === 'CONCESSION')
      .map(it => ({
        productId: it.productId!,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      }));

    // Payload en el formato esperado por el backend (CreateOrderDTO)
    const payload = {
      userId: Number(user.id),
      paymentMethodId: paymentMethodId,
      items: orderItems,
      concessions: orderConcessions.length > 0 ? orderConcessions : undefined,
      promotionCode: cartSnapshot.promotion?.code || undefined,
    };

    console.log('Payload enviado al backend:', JSON.stringify(payload, null, 2));

    orderConfirmMutation.mutate(payload, {
      onSuccess: async (confirmation) => {
        // Invalidate any future order list / caches
        queryClient.invalidateQueries({ queryKey: ['order', confirmation.id] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        clearPromotion();
        setIsProcessing(false);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/confirmacion/${confirmation.id}`);
        }, 900);
      },
      onError: (err: any) => {
        console.error('Error confirmando orden', err);
        console.error('Response data:', err?.response?.data);
        console.error('Response status:', err?.response?.status);
        setIsProcessing(false);
        
        // Extract validation errors if present
        const errors = err?.response?.data?.errors;
        if (errors && Array.isArray(errors)) {
          console.error('Validation errors:', errors);
          // Show each validation error
          errors.forEach((error: any) => {
            const field = error.field || 'Campo';
            const message = error.defaultMessage || error.message || 'Error de validación';
            toast.error(`${field}: ${message}`);
          });
        } else {
          const errorMsg = err?.response?.data?.message || err?.message || 'Error confirmando la orden';
          toast.error(errorMsg);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded p-6">
        <h2 className="text-2xl font-semibold mb-4">Pago y Confirmación</h2>
        {/* Preview dinámico */}
        <div className="mb-6 border rounded p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Resumen de Orden (Preview)</h3>
          {previewLoading && <p className="text-sm text-gray-500">Calculando...</p>}
          {previewError && <p className="text-sm text-red-500">Error obteniendo preview</p>}
          {preview && !previewLoading && !previewError && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Entradas</span><span>S/ {preview.ticketsSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Concesiones</span><span>S/ {preview.concessionsSubtotal.toFixed(2)}</span></div>
              {/* IGV / tax line */}
              <div className="flex justify-between"><span>IGV (18%)</span><span>S/ {(preview.taxTotal ?? Math.max(0, (preview.ticketsSubtotal + preview.concessionsSubtotal - preview.discountTotal) * 0.18)).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Descuento</span><span className="text-green-600">- S/ {preview.discountTotal.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span>S/ {preview.grandTotal.toFixed(2)}</span></div>
              {preview.promotion && (
                <p className="text-xs text-gray-600">Promoción aplicada: {preview.promotion.code} ({preview.promotion.type === 'PERCENT' ? preview.promotion.value + '%' : 'S/ ' + preview.promotion.value})</p>
              )}
            </div>
          )}
        </div>
        {/* Código de promoción */}
        <div className="mb-6 border rounded p-4 bg-gray-50">
          <h3 className="text-sm font-semibold mb-2">Código de Promoción</h3>
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="PROMO2025"
                className="flex-1 border px-2 py-1 rounded"
              />
              <button
                type="button"
                onClick={() => validatePromotion(promoCode)}
                disabled={promoLoading || !promoCode.trim()}
                className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
              >
                {promoLoading ? 'Validando...' : 'Aplicar'}
              </button>
              {cartSnapshot.promotion && (
                <button
                  type="button"
                  onClick={() => { clearPromotion(); setPromoCode(''); }}
                  className="px-3 py-1 rounded bg-gray-300 text-sm"
                >Quitar</button>
              )}
            </div>
            {promoError && <p className="text-xs text-red-500 mt-1">Promoción inválida</p>}
            {promotion && <p className="text-xs text-green-600 mt-1">Aplicada: {promotion.code}</p>}
        </div>

        {/* Métodos de pago */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Método de Pago</h3>
          
          {/* Lista de métodos de pago registrados */}
          {paymentMethods && paymentMethods.length > 0 && (
            <div className="space-y-3 mb-4">
              {paymentMethods.map((pm) => {
                const isDefault = pm.isDefault || pm.default;
                const isSelected = selectedPaymentMethodId === pm.id;
                return (
                  <div
                    key={pm.id}
                    onClick={() => {
                      setSelectedPaymentMethodId(pm.id);
                      setShowAddPaymentForm(false);
                    }}
                    className={`border rounded p-4 cursor-pointer transition-all relative ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {isDefault && (
                      <span className="absolute top-2 right-2 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                        Recomendado
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedPaymentMethodId(pm.id);
                          setShowAddPaymentForm(false);
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{pm.holderName || pm.cardHolder || 'Tarjeta'}</p>
                        <p className="text-xs text-gray-600">
                          {pm.brand && <span className="font-semibold">{pm.brand} </span>}
                          **** **** **** {pm.last4 || '****'}
                        </p>
                        {(pm.expMonth || pm.expiryMonth) && (pm.expYear || pm.expiryYear) && (
                          <p className="text-xs text-gray-500">
                            Vence: {pm.expMonth || pm.expiryMonth}/{pm.expYear || pm.expiryYear}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botón para añadir nuevo método de pago */}
          {!showAddPaymentForm && (
            <button
              type="button"
              onClick={() => {
                setShowAddPaymentForm(true);
                setSelectedPaymentMethodId(null);
              }}
              className="w-full border-2 border-dashed border-gray-300 rounded p-3 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              + Añadir nuevo método de pago
            </button>
          )}

          {/* Formulario para añadir nuevo método de pago */}
          {showAddPaymentForm && (
            <div className="border rounded p-4 bg-gray-50 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Nuevo método de pago</h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPaymentForm(false);
                    if (paymentMethods && paymentMethods.length > 0) {
                      const defaultMethod = paymentMethods.find(pm => pm.isDefault || pm.default);
                      setSelectedPaymentMethodId(defaultMethod?.id || paymentMethods[0].id);
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Número de tarjeta</label>
                <input 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  placeholder="XXXX XXXX XXXX XXXX" 
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre en la tarjeta</label>
                <input 
                  value={cardName} 
                  onChange={(e) => setCardName(e.target.value)} 
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">MM/AA</label>
                  <input 
                    value={expiry} 
                    onChange={(e) => setExpiry(e.target.value)} 
                    placeholder="MM/AA" 
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <input 
                    value={cvv} 
                    onChange={(e) => setCvv(e.target.value)} 
                    placeholder="123" 
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total a pagar</p>
                <p className="text-xl font-semibold">S/ {(preview?.grandTotal ?? 0).toFixed(2)}</p>
              </div>
              <button
                type="submit"
                disabled={isProcessing || previewLoading || previewError || orderConfirmMutation.isPending}
                className={"px-4 py-2 rounded text-white " + (isProcessing || previewLoading || previewError || orderConfirmMutation.isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600')}
              >
                {isProcessing || orderConfirmMutation.isPending ? 'Confirmando...' : previewLoading ? 'Calculando...' : previewError ? 'Error' : 'Confirmar y Pagar'}
              </button>
            </div>
          </div>
        </form>

        {isProcessing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded p-6 text-center">
              <p className="mb-2">Procesando pago...</p>
              <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full mx-auto" />
            </div>
          </div>
        )}

        {success && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded p-6 text-center">
              <h3 className="text-lg font-semibold">Pago exitoso</h3>
              <p className="text-sm text-gray-600">Serás redirigido a la confirmación para descargar tu comprobante.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarritoTotal;
