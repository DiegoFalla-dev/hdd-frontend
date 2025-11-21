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
// OrderConfirmation type not used here

const CarritoTotal: React.FC = () => {
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
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
        // If pending includes a price use it immediately
        const initialPrice = pending.pricePerSeat || 0;
        if (initialPrice && initialPrice > 0) {
          setTicketGroup(pending.showtimeId, pending.seats, initialPrice);
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
    // Validación menos estricta:
    // - número de tarjeta: 12 a 19 dígitos (se permiten espacios/guiones en el input)
    // - CVV: 3 dígitos
    // - expiry: opcional; si se proporciona debe ser MM/YY ó MM/YYYY
    // - DNI: opcional (si se proporciona, mínimo 4 caracteres)
    const cc = cardNumber.replace(/\D/g, '');
    if (cc.length < 12 || cc.length > 19) return false;
    if (cvv && !/^[0-9]{3}$/.test(cvv)) return false;
    if (expiry && expiry.trim() !== '') {
      if (!/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(expiry)) return false;
    }
    if (dni && dni.trim() !== '' && dni.trim().length < 4) return false;
    return true;
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
      if (missingSession) {
        toast.error('Falta sessionId de reserva en algún showtime. Regresa a butacas.');
        setIsProcessing(false);
        return;
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

    const payload = {
      // Nuevo cuerpo propuesto para /payments/process
      sessionMap, // relación showtimeId -> sessionId
      items, // lista normalizada
      promotionCode: cartSnapshot.promotion?.code,
      discountTotal: discount,
      grandTotal: expectedGrand,
      // Campos legacy para compatibilidad con confirmación actual
      ticketGroups: cartSnapshot.ticketGroups.map(g => ({ showtimeId: g.showtimeId, seatCodes: g.seatCodes })),
      concessions: cartSnapshot.concessions.map(c => ({ productId: c.productId, quantity: c.quantity })),
    };

    orderConfirmMutation.mutate(payload, {
      onSuccess: async (confirmation) => {
        // Invalidate any future order list / caches
        queryClient.invalidateQueries({ queryKey: ['order', confirmation.orderId] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        clearPromotion();
        setIsProcessing(false);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/confirmacion/${confirmation.orderId}`);
        }, 900);
      },
      onError: (err) => {
        console.error('Error confirmando orden', err);
        setIsProcessing(false);
        toast.error('Error confirmando la orden');
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
        <div className="mb-6">
          <p className="text-sm text-gray-600">Por favor ingresa los datos de la tarjeta para procesar el pago.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">DNI</label>
            <input value={dni} onChange={(e) => setDni(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Número de tarjeta</label>
            <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="XXXX XXXX XXXX XXXX" className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Nombre en la tarjeta</label>
            <input value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">MM/AA</label>
              <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/AA" className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">CVV</label>
              <input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

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
