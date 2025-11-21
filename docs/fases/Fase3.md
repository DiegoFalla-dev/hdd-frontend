## Fase 3 – State Management Global y Data Fetching

### Objetivos
1. Introducir React Query para estandarizar obtención/caché de datos remotos.
2. Crear stores globales (Zustand) para carrito y selección de butacas.
3. Preparar base para optimizaciones (prefetch, staleTime granular) y futuras fases (promociones, confirmación de compra, selección de asientos).

### Cambios Implementados
| Componente / Archivo | Cambio | Propósito |
|----------------------|--------|----------|
| `package.json` | Añadidas dependencias `@tanstack/react-query` y `zustand` | Herramientas de caché y estado global |
| `src/lib/queryClient.ts` | Configuración inicial `QueryClient` (retry, staleTime base) | Centralizar opciones por defecto |
| `src/main.tsx` | Se envuelve la app con `<QueryClientProvider>` | Habilitar React Query en toda la UI |
| `src/hooks/useMovies.ts` | Hooks paginados y lista completa (`useMovies`, `useAllMovies`) | Reemplazar efectos manuales para películas |
| `src/hooks/useCinemas.ts` | Hook `useCinemas` | Acceso cacheado a cines |
| `src/hooks/useConcessions.ts` | Hook `useConcessions(cinemaId)` | Productos por cine con caché y enabled condicional |
| `src/hooks/useShowtimes.ts` | Hook `useShowtimes({ movieId, cinemaId, date })` | Base para horarios dinámicos por parámetros |
| `src/store/cartStore.ts` | Store carrito (tickets, concessions, promoción, totales) | Modelo de compra centralizado |
| `src/store/seatSelectionStore.ts` | Store selección asientos por showtime | Interacción sala y persistencia temporal |
| `src/components/HeroBanner.tsx` | Refactor para usar `useAllMovies` | Eliminar lógica ad-hoc y aprovechar caché |

### Detalles Técnicos
**React Query**: Se configuró `QueryClient` con `refetchOnWindowFocus: false` para reducir noise y un `staleTime` general (1m) ajustado en hooks según volatilidad (películas 2m, cines 10m, concesiones 5m, showtimes 1m). Cada hook define su `queryKey` con parámetros relevantes asegurando segmentación de caché.

**Hooks**:
- `useMovies(params)`: Paginación y filtros; listo para integrarse en listas y carruseles.
- `useAllMovies()`: Lista breve para banners/hero sin reimplementar paginación.
- `useCinemas()`: Asume baja frecuencia de cambio → staleTime alto.
- `useConcessions(cinemaId)`: Activación condicional (`enabled`) evitando llamadas sin contexto.
- `useShowtimes(params)`: Base para próxima fase de selección de butacas; retorna arreglo vacío si faltan parámetros para mantener consistencia.

**Zustand Stores**:
- `cartStore`: Maneja tickets (seatId + showtimeId + price), productos de concesión con cantidad, código de promoción aplicado y cálculo de totales. Acciones puras: `addTicket`, `removeTicket`, `addConcession`, `updateConcession`, `removeConcession`, `applyPromotion`, `clearPromotion`, `clearCart`. Selectores derivados (`ticketsTotal`, `concessionsTotal`, `discountTotal`, `grandTotal`) proveen encapsulación y reducen recomputaciones externas.
- `seatSelectionStore`: Gestiona `showtimeId` activo y arreglo de `selectedSeatIds`, con `setShowtime` que resetea asientos al cambiar función, `toggleSeat` y `clearSelection`. Preparado para extender con expiraciones/reservas temporales en Fase 4.

**Refactor HeroBanner**: Eliminado `useEffect` manual; ahora utiliza datos cacheados evitando refetches duplicados cuando otras vistas solicitan películas.

### Beneficios Inmediatos
1. Menor duplicación de lógica de fetch y estados de carga.
2. Capa de caché reutilizable acelerando navegación entre vistas.
3. Separación clara: datos remotos (React Query) vs estado transaccional/temporal (Zustand).
4. Base lista para prefetch posterior (ej. películas populares tras login, concessions al seleccionar cine).

### Próximos Pasos (Pendientes Fase 3 / 4)
- Integrar hooks en componentes restantes (Cartelera, Dulceria, DetallePelicula) sustituyendo efectos locales.
- Añadir prefetch estratégico tras acciones clave (login, selección de cine) → tarea "Optimizar carga de datos".
- Extender `seatSelectionStore` con temporizador de bloqueo y sincronización con backend de disponibilidad real.
- Implementar validación de promoción vía endpoint `/promotions/validate` y conexión con `applyPromotion`.
- Normalizar fuente de precios tickets si backend expone tarifa dinámica.

### Riesgos / Consideraciones
- Falta manejo estandarizado de errores (planeado Fase 6) → por ahora errores caerán al nivel componente.
- Timings (`staleTime`) deberán ajustarse tras observar patrones reales de uso.
- Reserva de asientos requiere endpoints de locking para evitar condiciones de carrera (confirmar diseño backend).

### Checklist Fase 3
- [x] React Query instalado y configurado.
- [x] Provider global.
- [x] Hooks de dominio base.
- [x] Store carrito.
- [x] Store selección asientos.
- [x] Refactor componente inicial (HeroBanner) a hook.
- [ ] Integrar hooks en vistas restantes.
- [ ] Prefetch estratégico.
- [ ] Validación de promoción.

---
_Fase 3 establece la arquitectura de datos consumibles y estado transaccional que habilita las interacciones complejas de compra y reserva en fases siguientes._
