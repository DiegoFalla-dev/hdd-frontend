# 🎬 Integración del Sistema de Butacas v2.0 - Documentación Frontend

## ✅ Cambios Implementados

### 1. **Nuevo Servicio API** (`seatsApi.ts`)
Se creó un servicio completo que incluye:

- ✅ `initiateReservation()` - Reserva temporal de asientos (1 minuto)
- ✅ `confirmPurchase()` - Confirma compra y convierte asientos a OCCUPIED
- ✅ `releaseReservation()` - Libera reserva manualmente
- ✅ `cancelSeats()` - Cancela asientos permanentemente (CANCELLED)
- ✅ `releaseOccupiedSeats()` - Libera asientos OCCUPIED sin purchaseNumber
- ✅ `getSeatMatrix()` - Obtiene matriz de asientos con coordenadas
- ✅ `getSessionSeats()` - Obtiene asientos de una sesión

**Utilidades de localStorage:**
- `saveSessionId()`, `getSessionId()`, `clearSessionId()`
- `saveReservationExpiry()`, `getReservationExpiry()`
- `clearReservationSession()` - Limpia toda la sesión

---

### 2. **Hook Personalizado** (`useSeatReservation.ts`)
Hook de React que maneja toda la lógica de reserva:

#### Estados:
- `seats` - Array de asientos con estado y coordenadas
- `selectedSeats` - IDs de asientos seleccionados por el usuario
- `sessionId` - UUID de la sesión de reserva activa
- `timeRemaining` - Segundos restantes del temporizador (cuenta regresiva)
- `isReserving` - Flag de carga durante reserva
- `error` - Mensajes de error
- `loading` - Flag de carga inicial

#### Funciones:
- `selectSeat(seatIdentifier)` - Seleccionar asiento (valida disponibilidad)
- `deselectSeat(seatIdentifier)` - Deseleccionar asiento
- `reserveSeats(userId?)` - Inicia reserva temporal (1 minuto)
- `confirmReservation(purchaseNumber)` - Confirma compra
- `cancelReservation()` - Cancela reserva manualmente
- `refreshSeats()` - Recarga matriz desde el backend

#### Características:
✅ **Temporizador automático** - Cuenta regresiva de 60 segundos
✅ **Restauración de sesión** - Si el usuario recarga la página, recupera la sesión activa
✅ **Liberación automática** - Limpia sesión cuando expira el temporizador
✅ **Validaciones** - No permite seleccionar asientos CANCELLED u OCCUPIED

---

### 3. **Componente SeatMap** (`SeatMap.tsx`)
Componente visual para la matriz de asientos:

#### Props:
```typescript
{
  seats: Seat[];
  selectedSeats: string[];
  onSeatClick: (seatIdentifier: string) => void;
  sessionId: string | null;
  timeRemaining: number;
  loading?: boolean;
}
```

#### Características Visuales:
- 🟢 **Verde** - Asiento AVAILABLE (disponible)
- 🔴 **Rojo** - Asiento seleccionado por este usuario
- 🟡 **Amarillo** - Asiento TEMPORARILY_RESERVED por este usuario
- 🟠 **Naranja** - Asiento TEMPORARILY_RESERVED por otro usuario
- ⚫ **Gris** - Asiento OCCUPIED (vendido)
- ⬛ **Negro semi-transparente** - Asiento CANCELLED (bloqueado)

#### Temporizador:
- Muestra **MM:SS** en la parte superior
- Color amarillo normal, **rojo pulsante** cuando quedan ≤10 segundos
- Desaparece cuando no hay sessionId activo

#### Organización:
- Matriz organizada por `rowPosition` y `colPosition` (backend)
- Etiquetas de filas (A, B, C, ...) a ambos lados
- Números de columna en cada asiento
- Leyenda de estados en la parte inferior

---

### 4. **Página Butacas** (`Butacas.tsx`)
Flujo completo de selección y reserva:

#### Flujo de Usuario:
1. **Selección** - Usuario hace click en asientos disponibles
2. **Validación** - No puede seleccionar más asientos que entradas compradas
3. **Reserva** - Click en "Reservar Asientos (1 min)" llama a `reserveSeats()`
4. **Temporizador** - Se activa cuenta regresiva de 60 segundos
5. **Navegación** - Botón "Continuar a Dulcería" (solo si hay sessionId)

#### Validaciones:
- ✅ Verifica que hay entradas seleccionadas
- ✅ Limita selección al número de entradas
- ✅ Solo permite reservar si selección == total entradas
- ✅ Impide navegación sin sessionId activo
- ✅ Guarda `selectedSeats` en localStorage

#### Integración con Usuario:
- Si el usuario está logueado, pasa `userId` a `reserveSeats()`
- Si no está logueado, la reserva se hace sin `userId` (anónima)

---

### 5. **Página CarritoTotal** (`CarritoTotal.tsx`)
Confirmación de compra con integración v2.0:

#### Cambios Principales:
```typescript
// Antes (simulación):
setTimeout(() => { /* fake success */ }, 1600);

// Ahora (real):
const purchaseNumber = `ORD-${Date.now()}-${randomId}`;
await confirmPurchase({ sessionId, purchaseNumber });
clearReservationSession();
```

#### Flujo de Confirmación:
1. **Validación** - Verifica que existe `sessionId` activo
2. **Generación** - Crea `purchaseNumber` único
3. **Confirmación** - Llama a `confirmPurchase()` (backend)
4. **PDF** - Genera comprobante con QR
5. **Limpieza** - Llama a `clearReservationSession()`
6. **Navegación** - Redirige a Home tras 3 segundos

#### Manejo de Errores:
- ⚠️ Si sessionId expiró → Alerta + Redirige a `/butacas`
- ⚠️ Si error de red → Muestra mensaje de error
- ⚠️ Si no hay sessionId → Redirige inmediatamente

---

### 6. **Página DetallePelicula** (`DetallePelicula.tsx`)
Validación de usuario antes de comprar:

#### Cambios:
```typescript
// Antes de navegar a /confirmacion:
const isLoggedIn = !!localStorage.getItem('cineplus:user');
if (!isLoggedIn) {
  window.dispatchEvent(new CustomEvent('openProfileModal'));
  return; // Bloquea navegación
}
```

#### Comportamiento:
- ✅ Valida si el usuario está logueado
- ✅ Si NO está logueado → Muestra modal de login (Navbar)
- ✅ Si está logueado → Continúa a /confirmacion
- ✅ Guarda `movieSelection` y `selectedCine` en localStorage

---

## 🔄 Flujo Completo End-to-End

### **Escenario 1: Compra Exitosa**

```
1. DetallePelicula
   → Usuario selecciona horario + formato
   → Click "COMPRAR ENTRADAS"
   → Valida login (si no, modal)
   → Guarda movieSelection, selectedCine
   → Navega a /confirmacion

2. Confirmacion
   → Muestra resumen
   → Click "Continuar"
   → Navega a /carrito-entradas

3. CarritoEntradas
   → Selecciona cantidad de entradas
   → Guarda selectedEntradas
   → Navega a /butacas

4. Butacas ⭐ NUEVO SISTEMA
   → Carga matriz con getSeatMatrix(showtimeId)
   → Usuario selecciona asientos
   → Click "Reservar Asientos (1 min)"
   → Llama initiateReservation() → recibe sessionId
   → ⏱️ Temporizador inicia (60 seg)
   → Guarda sessionId + expiryTime en localStorage
   → Click "Continuar a Dulcería"
   → Navega a /dulceria-carrito

5. CarritoDulceria (opcional)
   → Agrega productos
   → Click "Continuar"
   → Navega a /pago

6. CarritoTotal ⭐ CONFIRMACIÓN
   → Valida que sessionId existe
   → Usuario completa datos de pago
   → Click "Pagar"
   → Genera purchaseNumber
   → Llama confirmPurchase(sessionId, purchaseNumber)
   → Backend: TEMPORARILY_RESERVED → OCCUPIED
   → Genera PDF con QR
   → Limpia localStorage
   → ✅ Éxito → Home
```

---

### **Escenario 2: Usuario Abandona (Expiración)**

```
1-4. [Igual que Escenario 1]

5. Butacas
   → Usuario reserva asientos
   → ⏱️ Temporizador: 60... 59... 58...
   → Usuario cierra ventana / se distrae
   → ⏱️ Temporizador: 3... 2... 1... 0
   
   Frontend:
   → clearReservationSession()
   → selectedSeats = []
   → sessionId = null
   → Alerta: "Reserva expirada"
   
   Backend (Scheduler cada 30 seg):
   → Encuentra reserva con expiryTime < now()
   → Cambia asientos a AVAILABLE
   → Marca reserva como inactiva
   → Libera sessionId
```

---

### **Escenario 3: Restauración de Sesión**

```
1-4. [Usuario reserva asientos]

5. Butacas
   → Usuario reserva asientos (sessionId = "abc123")
   → ⏱️ 45 segundos restantes
   → Usuario recarga página (F5)
   
   → useEffect restauración:
     - Lee sessionId desde localStorage
     - Lee expiryTime
     - Calcula tiempo restante (ahora vs expiry)
     - Si válido: restaura sessionId + temporizador
     - Llama getSessionSeats(sessionId) → ["A1", "A2"]
     - Restaura selectedSeats
   
   → Usuario ve:
     - Asientos A1, A2 en amarillo (su reserva)
     - ⏱️ Temporizador en 43 segundos (actualizado)
     - Botón "Continuar a Dulcería" activo
```

---

## 🛠️ Configuración del Backend (Recordatorio)

### Endpoints Necesarios:
```
POST   /api/seat-reservations/{showtimeId}              → Reservar
POST   /api/seat-reservations/confirm                   → Confirmar
DELETE /api/seat-reservations/{sessionId}               → Liberar
POST   /api/seat-reservations/cancel/{showtimeId}       → Cancelar
POST   /api/seat-reservations/release-occupied/{showtimeId} → Liberar ocupados
GET    /api/seat-reservations/{showtimeId}/matrix       → Matriz
GET    /api/seat-reservations/{sessionId}/seats         → Asientos de sesión
```

### Base URL del Backend:
Verificar que `apiClient.ts` apunta a la URL correcta:
```typescript
// src/services/apiClient.ts
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',  // Ajustar según tu backend
  timeout: 10000
});
```

---

## 📊 Estados de Asientos (Referencia Rápida)

| Estado | Color | Descripción | Clickeable |
|--------|-------|-------------|------------|
| **AVAILABLE** | 🟢 Verde | Disponible para reservar | ✅ Sí |
| **TEMPORARILY_RESERVED** (otros) | 🟠 Naranja | Reservado por otro usuario | ❌ No |
| **TEMPORARILY_RESERVED** (yo) | 🟡 Amarillo | Mi reserva temporal | ✅ Sí (deseleccionar) |
| **OCCUPIED** | ⚫ Gris | Vendido (con purchaseNumber) | ❌ No |
| **CANCELLED** | ⬛ Negro | Bloqueado permanentemente | ❌ No |
| **Seleccionado** (local) | 🔴 Rojo | Seleccionado pero no reservado | ✅ Sí (deseleccionar) |

---

## ⚠️ Consideraciones Importantes

### 1. **showtimeId**
El sistema v2.0 requiere un `showtimeId` válido. Actualmente hay un fallback temporal:
```typescript
// Butacas.tsx
const savedShowtimeId = (() => {
  // ... intenta leer de localStorage
  return 1; // Fallback temporal para desarrollo
})();
```

**TODO**: Asegurarse de que DetallePelicula/Confirmacion guarden el `showtimeId` real del backend.

### 2. **userId Opcional**
El sistema permite reservas anónimas (sin userId). Si el usuario está logueado:
```typescript
const user = authService.getCurrentUser();
await reserveSeats(user?.id);
```

### 3. **Duración del Temporizador**
Actualmente hardcodeado a 60 segundos (1 minuto):
```typescript
// useSeatReservation.ts
const RESERVATION_DURATION_MS = 60000;
```

Debe coincidir con el backend:
```java
// SeatReservationServiceImpl.java
private static final int RESERVATION_DURATION_MINUTES = 1;
```

### 4. **Scheduler del Backend**
El backend libera reservas expiradas cada 30 segundos. Puede haber un delay máximo de 30 seg después de la expiración.

### 5. **Manejo de Errores**
Todos los endpoints manejan errores con `try/catch`. Los errores más comunes:
- **400 Bad Request** - Asiento ya reservado
- **404 Not Found** - Sesión no encontrada (expiró)
- **409 Conflict** - Conflicto de concurrencia

---

## 🧪 Testing Manual

### Test 1: Reserva y Confirmación
```
1. Ir a DetallePelicula → Seleccionar horario → Comprar
2. Ir a CarritoEntradas → Seleccionar 2 entradas → Continuar
3. Ir a Butacas → Seleccionar 2 asientos → Reservar
4. Verificar temporizador aparece (60 seg)
5. Ir a CarritoTotal → Completar pago → Pagar
6. Verificar PDF se descarga
7. Verificar redirección a Home
8. Backend: Verificar asientos en estado OCCUPIED
```

### Test 2: Expiración de Reserva
```
1. Igual pasos 1-3 del Test 1
2. Esperar 60 segundos (no hacer nada)
3. Verificar temporizador llega a 0
4. Verificar alerta "Reserva expirada"
5. Verificar selectedSeats se limpia
6. Backend: Verificar asientos vuelven a AVAILABLE
```

### Test 3: Restauración de Sesión
```
1. Igual pasos 1-3 del Test 1
2. Recargar página (F5) antes de 60 seg
3. Verificar asientos siguen seleccionados (amarillo)
4. Verificar temporizador continúa (tiempo restante correcto)
5. Continuar con compra normalmente
```

### Test 4: Asientos Bloqueados (CANCELLED)
```
1. Backend: Usar endpoint POST /cancel para marcar asiento A1
2. Frontend: Ir a Butacas
3. Verificar asiento A1 aparece en negro semi-transparente
4. Intentar hacer click en A1
5. Verificar aparece mensaje "Bloqueado permanentemente"
6. Verificar no se puede seleccionar
```

---

## 📝 Próximos Pasos

### Implementaciones Pendientes:
- [ ] Obtener `showtimeId` real del backend (eliminar fallback temporal)
- [ ] Agregar WebSocket para actualización en tiempo real (opcional)
- [ ] Implementar notificación visual cuando otro usuario toma asiento
- [ ] Agregar sonido cuando quedan 10 segundos
- [ ] Mejorar manejo de errores de red (retry, offline detection)
- [ ] Agregar tests unitarios para `useSeatReservation`
- [ ] Agregar tests E2E con Playwright/Cypress

### Mejoras de UX:
- [ ] Animación de transición de estados
- [ ] Toast notifications en vez de `alert()`
- [ ] Loading skeletons durante carga de matriz
- [ ] Indicador visual de asientos "casi vendidos"
- [ ] Permitir zoom en la matriz en mobile

---

## 🐛 Troubleshooting

### Problema: "No hay una reserva activa"
**Causa**: sessionId no existe o expiró
**Solución**: 
1. Verificar localStorage: `localStorage.getItem('cineplus:sessionId')`
2. Verificar expiryTime: `localStorage.getItem('cineplus:reservationExpiry')`
3. Si expiró, volver a Butacas y reservar nuevamente

### Problema: Temporizador no aparece
**Causa**: sessionId es null
**Solución**:
1. Verificar que `reserveSeats()` completó exitosamente
2. Verificar que backend retornó `sessionId` válido
3. Revisar console.log para errores

### Problema: Asientos no se actualizan
**Causa**: refreshSeats() no se llama después de reservar
**Solución**:
1. Verificar que `reserveSeats()` llama `await refreshSeats()`
2. Verificar que endpoint `/matrix` retorna datos correctos
3. Limpiar caché del navegador

### Problema: Error 404 al confirmar compra
**Causa**: Sesión expiró en el backend
**Solución**:
1. El frontend automáticamente redirige a /butacas
2. Usuario debe reservar asientos nuevamente
3. Completar compra en menos de 1 minuto

---

**Desarrollado por**: Equipo CinePlus Frontend  
**Fecha**: Noviembre 2025  
**Versión**: v2.0  
**Backend Documentación**: Ver `Sistema de Gestión de Butacas - CinePlus.md`
