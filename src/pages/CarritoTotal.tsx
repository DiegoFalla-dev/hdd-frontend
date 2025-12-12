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
import { getUserById, updateBillingInfo } from '../services/userService';
import { getAccessToken, clearOrderStorage } from '../utils/storage';
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
  const [userFidelityPoints, setUserFidelityPoints] = useState<number>(0);
  const [fidelityRedeemUnits, setFidelityRedeemUnits] = useState<number>(1); // cada unidad = 100 pts
  const [fidelityDiscountApplied, setFidelityDiscountApplied] = useState<number>(0);
  const [fidelityPointsRedeemed, setFidelityPointsRedeemed] = useState<number>(0);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showFidelityForm, setShowFidelityForm] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(100);

  // Datos del usuario para comprobantes
  const [userProfile, setUserProfile] = useState<any>(null);
  const [invoiceType, setInvoiceType] = useState<'BOLETA' | 'FACTURA'>('BOLETA');
  const [billingRuc, setBillingRuc] = useState('');
  const [billingRazonSocial, setBillingRazonSocial] = useState('');
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [showBillingForm, setShowBillingForm] = useState(false);

  const cartSnapshot = useCartStore(s => s.cartSnapshot());
  const setTicketGroup = useCartStore(s => s.setTicketGroup);
  const addConcession = useCartStore(s => s.addConcession);
  const clearCart = useCartStore(s => s.clearCart);
  const toast = useToast();
  const seatSelectionStore = useSeatSelectionStore();
  const queryClient = useQueryClient();
  const orderPreviewQuery = useOrderPreview(true);
  const orderConfirmMutation = useOrderConfirm();
  const promoValidation = usePromotionValidation();
  const { validate: validatePromotion, isLoading: promoLoading, promotion, error: promoError } = promoValidation;
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

  // Cargar puntos de fidelización del usuario
  useEffect(() => {
    const fetchFidelityPoints = async () => {
      if (!user?.id) return;
      const token = getAccessToken();
      if (!token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/users/${user.id}/fidelity-points`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserFidelityPoints(data.fidelityPoints || 0);
        }
      } catch (error) {
        console.warn('Error cargando puntos de fidelización:', error);
      }
    };
    fetchFidelityPoints();
  }, [user?.id]);

  // Cargar datos completos del usuario para comprobantes
  useEffect(() => {
    const loadUser = async () => {
      if (!user?.id) return;
      try {
        // Comentado: conversión de user.id que puede ser string o number
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        const data = await getUserById(userId);
        setUserProfile(data);
        setBillingRuc(data?.ruc || '');
        setBillingRazonSocial(data?.razonSocial || '');
      } catch (err) {
        console.error('No se pudo cargar datos de usuario', err);
      }
    };
    loadUser();
  }, [user?.id]);

  // Comentado: handleRedeemFidelity no se usa
  /*
  const handleRedeemFidelity = async () => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión para canjear puntos');
      return;
    }
    const pointsToRedeem = fidelityRedeemUnits * 100;
    if (pointsToRedeem > userFidelityPoints) {
      toast.error('No tienes suficientes puntos para esta cantidad');
      return;
    }
    setIsRedeeming(true);
    try {
      const token = getAccessToken();
      const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/users/${user.id}/redeem-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ points: pointsToRedeem }),
      });
      const data = await resp.json();
      if (!resp.ok || data.success === false) {
        toast.error(data.message || 'No se pudo canjear puntos');
        return;
      }
      const discount = parseFloat(data.discountAmount) || ((pointsToRedeem / 100) * 10);
      setUserFidelityPoints(data.remainingPoints ?? Math.max(0, userFidelityPoints - pointsToRedeem));
      setFidelityDiscountApplied(discount);
      toast.success(`Canjeado: S/ ${discount.toFixed(2)} de descuento`);
    } catch (err) {
      console.error('Error canjeando puntos', err);
      toast.error('Error al canjear puntos');
    } finally {
      setIsRedeeming(false);
    }
  };
  */

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

  const handleSaveBillingData = async () => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return;
    }
    if (!billingRuc.trim() || !billingRazonSocial.trim()) {
      setBillingError('RUC y Razón Social son requeridos');
      return;
    }
    if (billingRuc.trim().length < 8) {
      setBillingError('El RUC debe tener al menos 8 caracteres');
      return;
    }
    setBillingError(null);
    setBillingSaving(true);
    try {
      // Comentado: conversión de user.id que puede ser string o number
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      await updateBillingInfo(userId, billingRuc.trim(), billingRazonSocial.trim());
      setBillingMessage('Datos guardados. Tu cuenta no ha sido verificada, contacte con un asesor.');
      setUserProfile((prev: any) => ({ ...prev, ruc: billingRuc.trim(), razonSocial: billingRazonSocial.trim() }));
      toast.success('Información de facturación guardada');
      setShowBillingForm(false);
    } catch (err: any) {
      console.error('Error guardando facturación', err);
      setBillingError(err?.response?.data?.message || 'No se pudo guardar la información');
    } finally {
      setBillingSaving(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (invoiceType === 'FACTURA') {
      if (!userProfile?.isValid) {
        toast.error('Tu cuenta no ha sido verificada, contacte con un asesor.');
        return;
      }
      if (!userProfile?.ruc || !userProfile?.razonSocial) {
        toast.error('Completa RUC y Razón Social para facturar.');
        return;
      }
    }

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
    // Cálculo correcto: (subtotal - descuento) * 1.18 para incluir IGV
    const subtotalAfterDiscount = Math.max(0, itemsRawTotal - discount);
    const computedGrand = subtotalAfterDiscount * 1.18;
    if (Math.abs(computedGrand - expectedGrand) > 0.01) {
      console.warn('Diferencia en grandTotal calculado vs preview', { computedGrand, expectedGrand });
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

    // Construir payload de la orden
    
    // Payload en el formato esperado por el backend (CreateOrderDTO)
    const payload = {
      userId: Number(user.id),
      paymentMethodId: paymentMethodId,
      items: orderItems,
      concessions: orderConcessions.length > 0 ? orderConcessions : undefined,
      promotionCode: cartSnapshot.promotion?.code || undefined,
      fidelityPointsRedeemed: fidelityDiscountApplied > 0 ? fidelityPointsRedeemed || fidelityRedeemUnits * 100 : undefined,
      fidelityDiscountAmount: fidelityDiscountApplied > 0 ? fidelityDiscountApplied : undefined,
    };

    console.log('Payload enviado al backend:', JSON.stringify(payload, null, 2));

    orderConfirmMutation.mutate(payload, {
      onSuccess: async (confirmation) => {
        // Invalidate any future order list / caches
        queryClient.invalidateQueries({ queryKey: ['order', confirmation.id] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        
        // Limpiar completamente el carrito y datos temporales
        clearCart(); // Limpia ticketGroups y concessions del store
        clearPromotion();
        
        // Limpiar localStorage
        try {
          localStorage.removeItem('pendingOrder');
          localStorage.removeItem('selectedEntradas');
          localStorage.removeItem('cartStore');
        } catch (e) {
          console.warn('Error limpiando localStorage:', e);
        }
        
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
    <div className="min-h-screen py-12 animate-fade-in" style={{ background: "linear-gradient(180deg, #141113 0%, #0b0b0b 100%)" }}>
      <div className="max-w-3xl mx-auto card-glass shadow-2xl rounded-2xl p-10">
        <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-[#BB2228] to-[#E3E1E2] bg-clip-text text-transparent">Resumen de Compra</h2>
        {/* Preview dinámico */}
        <div className="mb-8 border rounded-xl p-6 backdrop-blur-sm" style={{ backgroundColor: 'rgba(57,58,58,0.2)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <h3 className="text-xl font-bold mb-4 text-[#E3E1E2]">📝 Detalle del Pedido</h3>
          {previewLoading && <p className="text-sm text-[#E3E1E2]/70">Calculando...</p>}
          {previewError && <p className="text-sm text-red-400">Error obteniendo preview</p>}
          {preview && !previewLoading && !previewError && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[#E3E1E2]">
                <span>🎫 Entradas</span>
                <span className="font-bold">S/ {preview.ticketsSubtotal.toFixed(2)}</span>
              </div>
              {preview.concessionsSubtotal > 0 && (
                <div className="flex justify-between text-[#E3E1E2]">
                  <span>🍿 Dulcería</span>
                  <span className="font-bold">S/ {preview.concessionsSubtotal.toFixed(2)}</span>
                </div>
              )}
              {preview.discountTotal > 0 && (
                <div className="flex justify-between font-bold text-green-400">
                  <span>🎉 Descuento promocional</span>
                  <span>- S/ {preview.discountTotal.toFixed(2)}</span>
                </div>
              )}
              {fidelityDiscountApplied > 0 && (
                <div className="flex justify-between font-bold text-amber-400">
                  <span>⭐ Descuento por puntos</span>
                  <span>- S/ {fidelityDiscountApplied.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[#E3E1E2]/60">
                <span>IGV (18%)</span>
                <span>S/ {(preview.taxTotal ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl border-t pt-3 mt-2 bg-gradient-to-r from-[#BB2228] to-[#8B191E] bg-clip-text text-transparent" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span>💰 Total a Pagar</span>
                <span>S/ {Math.max(0, (preview.grandTotal ?? 0) - fidelityDiscountApplied).toFixed(2)}</span>
              </div>
              {preview.promotion && (
                <p className="text-xs text-green-400 mt-2">✓ Promoción aplicada: {preview.promotion.code} ({preview.promotion.discountType === 'PERCENTAGE' ? preview.promotion.value + '%' : 'S/ ' + preview.promotion.value})</p>
              )}
            </div>
          )}
        </div>
        {/* Código de promoción */}
        <div className="mb-8 border rounded-xl p-6 backdrop-blur-sm" style={{ backgroundColor: 'rgba(57,58,58,0.2)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <h3 className="text-lg font-bold mb-4 text-[#E3E1E2]">🎫 ¿Tienes un código promocional?</h3>
            <div className="flex gap-3">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Ingresa tu código"
                className="flex-1 border px-4 py-3 rounded-xl input-focus-glow bg-[#141113]/50 text-white"
                style={{ borderColor: promoValidation.response && !promoValidation.response.isValid ? '#EF4444' : 'rgba(255,255,255,0.1)' }}
                disabled={!!cartSnapshot.promotion}
              />
              <button
                type="button"
                onClick={() => {
                  const subtotal = (preview?.ticketsSubtotal || 0) + (preview?.concessionsSubtotal || 0);
                  validatePromotion(promoCode, subtotal);
                }}
                disabled={promoLoading || !promoCode.trim() || !!cartSnapshot.promotion}
                className="px-6 py-3 rounded-xl text-white font-bold transition-all hover:scale-105"
                style={{ 
                  backgroundColor: (promoLoading || !promoCode.trim() || !!cartSnapshot.promotion) ? '#4B5563' : '#BB2228',
                  cursor: (promoLoading || !promoCode.trim() || !!cartSnapshot.promotion) ? 'not-allowed' : 'pointer',
                  opacity: (promoLoading || !promoCode.trim() || !!cartSnapshot.promotion) ? 0.5 : 1
                }}
              >
                {promoLoading ? 'Validando...' : 'Aplicar'}
              </button>
              {(cartSnapshot.promotion || (promoValidation.response && !promoValidation.response.isValid)) && (
                <button
                  type="button"
                  onClick={() => { 
                    clearPromotion(); 
                    setPromoCode(''); 
                    promoValidation.reset(); 
                  }}
                  className="px-4 py-3 rounded-xl font-bold transition-all hover:scale-110"
                  style={{ backgroundColor: '#E3E1E2', color: '#393A3A' }}
                  title="Limpiar"
                >✕</button>
              )}
            </div>
            {promoError && <p className="text-xs text-red-500 mt-1">Promoción inválida</p>}
            {promotion && <p className="text-xs text-green-600 mt-1">✓ Aplicada: {promotion.code}</p>}
            {promoValidation.response && !promoValidation.response.isValid && (
              <div className="mt-3 text-sm bg-red-50 border-l-4 border-red-600 rounded p-3 shadow-sm">
                <p className="font-semibold text-red-700 mb-2">
                  {promoValidation.response.message || 'Promoción no válida'}
                </p>
                {promoValidation.response.errorType === 'USAGE_LIMIT_EXCEEDED' && (
                  <p className="text-xs text-red-600 mt-1">
                    💡 Este código promocional agotó sus usos. Intenta con otro código.
                  </p>
                )}
                {promoValidation.response.errorType === 'SINGLE_USE_EXPIRED' && (
                  <p className="text-xs text-red-600 mt-1">
                    💡 Este código ya fue utilizado. Intenta con otro código.
                  </p>
                )}
                {promoValidation.response.errorType === 'DATE_RANGE_EXPIRED' && (
                  <p className="text-xs text-red-600 mt-1">
                    💡 Este código ha expirado. Intenta con otro código válido.
                  </p>
                )}
                {promoValidation.response.requiredAmount && (
                  <p className="mt-2 text-red-600 text-xs">Monto mínimo requerido: {promoValidation.response.requiredAmount}</p>
                )}
              </div>
            )}
        </div>

        {/* Puntos de Fidelización */}
        {userFidelityPoints > 0 && fidelityDiscountApplied === 0 && (
          <div className="mb-6">
            <div className="border rounded-lg p-5" style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: '#92400E' }}>Puntos de Fidelización</h3>
                  <p className="text-sm" style={{ color: '#78350F' }}>
                    Tienes <span className="font-bold">{userFidelityPoints} puntos</span> disponibles
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#92400E' }}>
                    Descuento disponible: <span className="font-bold">S/ {((userFidelityPoints / 100) * 10).toFixed(2)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFidelityForm(!showFidelityForm)}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold hover:shadow-lg transition-all"
                  style={{ backgroundColor: showFidelityForm ? '#92400E' : '#f59e0b' }}
                >
                  {showFidelityForm ? 'Cerrar' : 'Canjear'}
                </button>
              </div>
            </div>
            
            {/* Formulario de canje inline */}
            {showFidelityForm && (
              <div className="mt-4 border rounded-lg p-5" style={{ backgroundColor: 'white', borderColor: '#FDE68A' }}>
                <h4 className="text-sm font-semibold mb-4" style={{ color: '#393A3A' }}>¿Cuántos puntos deseas canjear?</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#78350F' }}>
                      Puntos (múltiplos de 10)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max={userFidelityPoints}
                      step="10"
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(Math.max(10, Math.min(userFidelityPoints, parseInt(e.target.value) || 10)))}
                      className="w-full px-4 py-2.5 rounded-lg text-lg font-semibold"
                      style={{ border: '2px solid #FDE68A', color: '#393A3A' }}
                    />
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#78350F' }}>Puntos a canjear:</span>
                      <strong style={{ color: '#92400E' }}>{pointsToRedeem} pts</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#78350F' }}>Descuento:</span>
                      <strong className="text-lg" style={{ color: '#f59e0b' }}>S/ {((pointsToRedeem / 100) * 10).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#78350F' }}>Puntos restantes:</span>
                      <strong style={{ color: '#92400E' }}>{Math.max(0, userFidelityPoints - pointsToRedeem)} pts</strong>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFidelityForm(false)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{ backgroundColor: '#E3E1E2', color: '#393A3A' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!user?.id) {
                          toast.error('Debes iniciar sesión');
                          return;
                        }
                        if (pointsToRedeem > userFidelityPoints || pointsToRedeem < 10 || pointsToRedeem % 10 !== 0) {
                          toast.error('Cantidad de puntos inválida');
                          return;
                        }
                        setIsRedeeming(true);
                        try {
                          const token = getAccessToken();
                          const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/users/${user.id}/redeem-points`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({ points: pointsToRedeem }),
                          });
                          const data = await resp.json();
                          if (!resp.ok || data.success === false) {
                            toast.error(data.message || 'No se pudo canjear puntos');
                            return;
                          }
                          const discount = parseFloat(data.discountAmount) || ((pointsToRedeem / 100) * 10);
                          setUserFidelityPoints(data.remainingPoints ?? Math.max(0, userFidelityPoints - pointsToRedeem));
                          setFidelityPointsRedeemed(pointsToRedeem);
                          setFidelityRedeemUnits(Math.max(0, Math.round(pointsToRedeem / 100)));
                          setFidelityDiscountApplied(discount);
                          setShowFidelityForm(false);
                          toast.success(`¡Canjeado: S/ ${discount.toFixed(2)} de descuento!`);
                        } catch (err) {
                          console.error('Error canjeando puntos', err);
                          toast.error('Error al canjear puntos');
                        } finally {
                          setIsRedeeming(false);
                        }
                      }}
                      disabled={isRedeeming || pointsToRedeem > userFidelityPoints || pointsToRedeem < 10}
                      className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-all"
                      style={{ 
                        backgroundColor: (isRedeeming || pointsToRedeem > userFidelityPoints || pointsToRedeem < 10) ? '#9CA3AF' : '#f59e0b',
                        cursor: (isRedeeming || pointsToRedeem > userFidelityPoints || pointsToRedeem < 10) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isRedeeming ? 'Canjeando...' : `Canjear ${pointsToRedeem} puntos`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comprobante: Boleta / Factura */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#141113' }}>Comprobante</h3>
          <div className="flex gap-3 mb-3">
            <button
              type="button"
              onClick={() => setInvoiceType('BOLETA')}
              className="flex-1 py-2.5 rounded-lg font-semibold transition-all"
              style={{
                backgroundColor: invoiceType === 'BOLETA' ? '#BB2228' : '#E5E7EB',
                color: invoiceType === 'BOLETA' ? 'white' : '#111827',
                border: invoiceType === 'BOLETA' ? '2px solid #BB2228' : '1px solid #E5E7EB'
              }}
            >
              Boleta
            </button>
            <button
              type="button"
              onClick={() => {
                if (userProfile?.isValid) {
                  setInvoiceType('FACTURA');
                }
              }}
              disabled={!userProfile?.isValid}
              className="flex-1 py-2.5 rounded-lg font-semibold transition-all"
              style={{
                backgroundColor: userProfile?.isValid && invoiceType === 'FACTURA' ? '#BB2228' : '#E5E7EB',
                color: userProfile?.isValid && invoiceType === 'FACTURA' ? 'white' : '#4B5563',
                border: userProfile?.isValid && invoiceType === 'FACTURA' ? '2px solid #BB2228' : '1px solid #E5E7EB',
                cursor: userProfile?.isValid ? 'pointer' : 'not-allowed',
                opacity: userProfile?.isValid ? 1 : 0.6
              }}
            >
              Factura
            </button>
          </div>

          {!userProfile?.isValid && (
            <div className="text-sm text-red-600 mb-2">
              Tu cuenta no ha sido verificada, contacte con un asesor. Sólo podrás emitir boleta.
              <div>
                <button
                  type="button"
                  onClick={() => { setInvoiceType('BOLETA'); setShowBillingForm(true); }}
                  className="text-amber-600 underline text-xs mt-1"
                >
                  Validar datos para factura
                </button>
              </div>
            </div>
          )}

          {invoiceType === 'BOLETA' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-1">
              <div><span className="font-semibold">DNI:</span> {userProfile?.nationalId || 'No disponible'}</div>
              <div><span className="font-semibold">Nombre:</span> {userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : 'No disponible'}</div>
            </div>
          )}

          {invoiceType === 'FACTURA' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              {!userProfile?.isValid && (
                <p className="text-sm text-gray-700">Completa los datos para la factura. No será permanente.</p>
              )}
              {billingMessage && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{billingMessage}</div>
              )}
              {billingError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{billingError}</div>
              )}
              {!showBillingForm && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-sm text-gray-700">
                    <div><span className="font-semibold">RUC:</span> {userProfile?.ruc || 'No configurado'}</div>
                    <div><span className="font-semibold">Razón Social:</span> {userProfile?.razonSocial || 'No configurada'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBillingForm(true)}
                    className="px-4 py-2 rounded bg-amber-500 text-white text-sm font-semibold"
                  >
                    {userProfile?.ruc && userProfile?.razonSocial ? 'Editar' : 'Validar datos'}
                  </button>
                </div>
              )}

              {showBillingForm && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">RUC</label>
                    <input
                      value={billingRuc}
                      onChange={(e) => setBillingRuc(e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="Ej: 20123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Razón Social</label>
                    <input
                      value={billingRazonSocial}
                      onChange={(e) => setBillingRazonSocial(e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="Ej: Mi Empresa S.A.C."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBillingData}
                      disabled={billingSaving}
                      className="flex-1 py-2 rounded text-white font-semibold"
                      style={{ backgroundColor: billingSaving ? '#9CA3AF' : '#22c55e' }}
                    >
                      {billingSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowBillingForm(false); setBillingError(null); }}
                      className="flex-1 py-2 rounded font-semibold"
                      style={{ backgroundColor: '#E5E7EB', color: '#111827' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Métodos de pago */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#141113' }}>Método de Pago</h3>
          
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
                    className="border rounded-lg p-4 cursor-pointer transition-all relative"
                    style={{
                      borderColor: isSelected ? '#BB2228' : '#E3E1E2',
                      backgroundColor: isSelected ? '#FEF2F2' : 'white',
                      borderWidth: isSelected ? '2px' : '1px'
                    }}
                  >
                    {isDefault && (
                      <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded" style={{ color: '#BB2228', backgroundColor: '#FEE2E2' }}>
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
          <div className="pt-6 mt-6" style={{ borderTop: '2px solid #E3E1E2' }}>
            <button
              type="submit"
              disabled={isProcessing || previewLoading || previewError || orderConfirmMutation.isPending}
              className="w-full py-4 rounded-lg text-white text-lg font-bold transition-all"
              style={{ 
                backgroundColor: (isProcessing || previewLoading || previewError || orderConfirmMutation.isPending) ? '#9CA3AF' : '#BB2228',
                cursor: (isProcessing || previewLoading || previewError || orderConfirmMutation.isPending) ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing || orderConfirmMutation.isPending ? 'Procesando pago...' : previewLoading ? 'Calculando...' : previewError ? 'Error' : `Confirmar y Pagar S/ ${Math.max(0, (preview?.grandTotal ?? 0) - fidelityDiscountApplied).toFixed(2)}`}
            </button>
            
            <button
              type="button"
              onClick={() => {
                // Limpiar stores de Zustand
                useCartStore.getState().clearCart();
                useCartStore.getState().clearPromotion();
                useSeatSelectionStore.getState().clearAll();
                
                // Limpiar localStorage
                clearOrderStorage();
                
                // Navegar al inicio
                navigate('/');
              }}
              className="w-full mt-3 py-3 rounded-lg text-sm font-semibold transition-all"
              style={{ 
                backgroundColor: '#E3E1E2',
                color: '#393A3A',
                cursor: 'pointer'
              }}
            >
              Cancelar y volver al inicio
            </button>
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
