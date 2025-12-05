## Fase 4 – Selección de Asientos y Reservas Temporales

### Objetivos
1. Integrar lógica real de selección de asientos vinculada a showtime (función) con persistencia temporal.
2. Consumir endpoints backend de ocupación y reservas temporales para evitar condiciones de carrera.
3. Preparar flujo de confirmación futura (fase de compra/orden) desacoplando estado transaccional local de estado definitivo en backend.
4. Reducir riesgo de sobreventa mediante expiración automática y liberación de asientos no confirmados.

### Cambios Implementados
| Componente / Archivo | Cambio | Propósito |
|----------------------|--------|----------|
| `src/services/seatService.ts` | Ajustado para usar `/seats/occupied`, `/seats/reserve`, `/seats/release`, `/seats/confirm` | Operaciones CRUD temporales sobre disponibilidad |
| `src/hooks/useSeats.ts` | Hook placeholder (lista completa futura) | Compatibilidad anticipada si se agrega endpoint de listado |
| `src/store/seatSelectionStore.ts` | Rediseño: estructura por `showtimeId`, expiración, persistencia en `localStorage`, limpieza automática | Mantener reservas locales coherentes y resilientes en refresh |
| `src/pages/Butacas.tsx` | Refactor: derivar `showtimeId` desde `useShowtimes`, integrar store, remover estado duplicado | UI consistente y lista para sincronización backend |

### Backend Endpoints Consumidos / Mapeo
| Endpoint | Método | Uso en Frontend | Resultado |
|----------|--------|-----------------|-----------|
| `/api/showtimes?cinema={id}&movie={id}&date=YYYY-MM-DD&format=X` | GET | Derivar lista de showtimes y obtener `id` | Identificar función seleccionada |
| `/api/showtimes/{id}/seats/occupied` | GET | Obtener códigos ocupados actuales | Marcar asientos no disponibles |
| `/api/showtimes/{id}/seats/reserve` | POST | Reservar temporalmente set de códigos | Lista de fallidos (conflictos) |
| `/api/showtimes/{id}/seats/release` | POST | Liberar reservas temporales (timeout / cancelación) | `204` sin cuerpo |
| `/api/showtimes/{id}/seats/confirm` | POST | Confirmar asientos como ocupados tras pago | `204` sin cuerpo |

> Nota: No existe hoy un endpoint de listado completo de asientos. El frontend genera matriz local (tamaños predefinidos) y superpone ocupados. Se deja hook y mapeo listo para migrar si backend incorpora `/seats` completo.

### Flujo de Datos (Texto)
1. Usuario selecciona película, cine, fecha, formato → se deriva `showtimeId` vía `useShowtimes`.
2. `seatSelectionStore.setCurrentShowtime(showtimeId)` inicializa bucket (seatCodes + expiresAt).
3. UI genera matriz base (local) y llama ocupados (`getOccupiedSeatCodes`). (Integración en progreso: aún falta overlay directo en componente para marcar ocupados reales).
4. Usuario hace click en asiento: store `toggleSeatCode(showtimeId, seatCode, max)` valida límite por cantidad de entradas.
5. (Próximo incremento) Al primer asiento seleccionado se hará POST `/seats/reserve` con batch; si algún asiento falla se remueve de selección y se notifica.
6. Timer (10 min) expira → `purgeExpired` limpia selección y se disparará `/seats/release` si había reservas temporales.
7. En confirmación de compra → POST `/seats/confirm` para estado definitivo antes de crear orden de tickets.

### Diseño del Store
```ts
interface ShowtimeSelection { seatCodes: string[]; expiresAt?: number }
selections: Record<showtimeId, ShowtimeSelection>
RESERVATION_WINDOW_MS = 10 * 60 * 1000
```
Motivación:
- Permite gestionar múltiples funciones si usuario abre varias pestañas.
- Persistencia en `localStorage` evita pérdida accidental (refresco, navegación). Renovación controlada no automática: si expira se purga.
- Preparado para incorporar estado "pendingRemote" y "failedCodes" sin romper la interfaz.

### Riesgos / Consideraciones
| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Falta de polling de ocupados | Usuario podría ver asiento libre ya reservado por otro | Añadir revalidación cada N segundos o al intentar confirmar |
| Reserva temporal no sincronizada aún | Posible conflicto en confirmación | Implementar POST `/seats/reserve` en selección inicial |
| Generación de matriz local rígida | Diferencias si backend maneja salas heterogéneas | Ampliar backend para devolver layout (rows/cols, zonas, categorías) |
| Expiración silenciosa | Experiencia confusa si desaparecen asientos | Mostrar countdown y aviso antes de liberar |
| Falta manejo de errores central | Estado UI inconsistente en fallos de red | Integrar capa de error boundary y toast para operaciones seats (Fase 6) |

### Próximos Incrementos (Post Fase 4)
1. Superponer ocupados reales en `Butacas.tsx` (GET ocupado antes de render y marcar `status='occupied'`).
2. Integrar reserva temporal real: batch al seleccionar primer asiento y handshake en cada toggle incremental.
3. Countdown visual + acción manual para extender (si política lo permite).
4. Polling o WebSocket para actualización de ocupados (reducción de latencia de conflicto).
5. Endpoint de layout de sala (capas: fila, columna, tipo de asiento, precio variable) → adaptar cálculo de tickets.
6. Confirmación atómica: reservar + crear orden + confirmar seats en una transacción backend.

### Checklist Fase 4
- [x] Store extendido con expiración y persistencia.
- [x] Refactor página `Butacas` integrando store y derivación `showtimeId`.
- [x] Servicio de asientos alineado con endpoints actuales (occupied/reserve/release/confirm).
- [ ] Overlay de ocupados aplicado en render inicial.
- [ ] Llamada real a `/seats/reserve` en primera selección.
- [ ] Manejo de expiración visual (countdown / alerta).
- [ ] Confirmación integra `/seats/confirm` previo a orden.

### Resumen
Fase 4 establece el cimiento de lógica de asientos trasladando la selección desde un modelo aislado hacia uno preparado para concurrencia controlada. Se implementa estructura escalable (persistencia y expiración) lista para añadir reservas remotas, polling y confirmación integral de compra en fases siguientes.

---
_La base de reservas temporales ya permite evolucionar hacia garantías de consistencia sin rediseñar la UI principal._
