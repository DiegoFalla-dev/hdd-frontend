# HDD Frontend - Documentación Completa

Sistema de venta de entradas de cine construido con React + TypeScript + Vite, integrado con backend de gestión de películas, cines, showtimes, asientos y órdenes.

## Stack Tecnológico

- **React 18** con TypeScript
- **Vite** para build y desarrollo
- **React Query** (@tanstack/react-query) para caché y data fetching
- **Zustand** para state management global
- **React Router** para navegación
- **Axios** como cliente HTTP
- **Socket.io** para actualizaciones en tiempo real de asientos

## Estructura del Proyecto

```
src/
├── components/        # Componentes reutilizables (Navbar, Footer, Modals, etc.)
├── pages/            # Vistas/páginas principales
├── services/         # Capa de comunicación con API
├── hooks/            # Custom hooks React Query
├── store/            # Stores Zustand (carrito, selección de asientos)
├── context/          # Contextos React (AuthContext)
├── types/            # TypeScript types y interfaces
├── utils/            # Utilidades (storage, helpers)
├── config/           # Configuración (env variables)
└── lib/              # Configuraciones de librerías (queryClient)
```

## Configuración Inicial

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=http://localhost:8080
```

El sistema automáticamente añade el sufijo `/api` a todas las peticiones.

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

Por defecto corre en `http://localhost:4000`

### Build

```bash
npm run build
```

---

## Historial de Desarrollo - Fases Implementadas

### Fase 0 – Análisis y Extensión Inicial de Endpoints

**Objetivo**: Realizar inventario de endpoints del backend, detectar brechas funcionales y aplicar extensiones mínimas sin romper compatibilidad.

#### Endpoints Originales Inventariados

**Películas** `/api/movies`
- GET listado completo
- GET `/api/movies/{id}` detalle
- POST crear, PUT actualizar, DELETE eliminar

**Cines / Salas** `/api/cinemas`, `/api/theaters`
- CRUD básico en ambos
- Filtro de salas por `cinemaId`

**Showtimes** `/api/showtimes`
- GET fechas disponibles y horarios según parámetros (`cinema`, `movie`, `date`, `format`)
- Gestión de asientos: generar, listar ocupados, reservar temporal, liberar, confirmar

**Concesiones** `/api/concessions`
- GET por cine y categoría opcional
- CRUD básico

**Promociones** `/api/promotions`
- GET todas, GET por id
- GET por código activo `/code/{code}`
- CRUD (solo ADMIN)

**Auth** `/api/auth`
- POST `/register`, POST `/login`

**Órdenes / Tickets** `/api/orders`
- GET todas (ADMIN), GET por id (ADMIN o dueño)
- GET por usuario `/user/{userId}`
- POST crear orden
- PATCH estado
- Gestión items (listar, detalle, marcar ticket usado)
- Descarga PDF factura, QR ticket, PDF ticket

**Métodos de Pago** `/api/users/{userId}/payment-methods`
- GET listado, POST crear

**Usuarios** `/api/users/{id}/name` obtener nombre

#### Brechas Detectadas y Soluciones

1. **Películas**: Añadidos filtros y paginación (`status`, `genre`, `q`, `page`, `size`)
   - Nuevos endpoints: `/now-playing`, `/upcoming`, `/presale`
2. **Auth**: Endpoint de refresh `POST /api/auth/refresh`
3. **Órdenes**: 
   - Preview sin persistencia: `POST /api/orders/preview`
   - Cancelación: `PATCH /api/orders/{id}/cancel`
4. **Promociones**: Validación `POST /api/promotions/validate?code=...&baseAmount=...`
5. **Métodos de Pago**: 
   - `DELETE /api/users/{userId}/payment-methods/{paymentMethodId}`
   - `PATCH /api/users/{userId}/payment-methods/{paymentMethodId}/default`

---

### Fase 1 – Configuración Base y Eliminación de Datos Estáticos

**Objetivo**: Eliminar datos estáticos del frontend, centralizar configuración API y establecer tipado base con cliente HTTP robusto.

#### Cambios Principales

1. **Sistema de Tipos** (`src/types/*`)
   - `Movie.ts`: Estados (NOW_PLAYING, UPCOMING, PRESALE), formatos, duración
   - `User.ts`: Perfil, roles (USER, ADMIN)
   - `Showtime.ts`: Función con película, cine, sala, fecha, hora, formato
   - `Seat.ts`: Código, fila, columna, estado (AVAILABLE, OCCUPIED, RESERVED)
   - `Theater.ts`: Sala con capacidad y tipo
   - `Promotion.ts`: Códigos promocionales con validación
   - `Order.ts`: Estructuras de preview y creación de orden
   - `PaymentMethod.ts`: Tarjetas guardadas
   - `Auth.ts`: JWT response, Login/Register requests

2. **Configuración Centralizada** (`src/config/env.ts`)
   - Normalización de `VITE_API_BASE_URL`
   - Sufijo `/api` automático

3. **Cliente HTTP Mejorado** (`src/services/apiClient.ts`)
   - Interceptor de Authorization con access token
   - Refresh automático en 401 usando `/auth/refresh`
   - Timeout y cancelación de solicitudes duplicadas
   - Manejo estandarizado de errores

4. **Almacenamiento Seguro** (`src/utils/storage.ts`)
   - `setAuthTokens`, `getAccessToken`, `getRefreshToken`, `clearAuthTokens`
   - Separación de tokens access/refresh

5. **Eliminación de Datos Estáticos**
   - **HeroBanner**: Usa películas destacadas reales (`fetchAllMovies()` filtrando `NOW_PLAYING`)
   - **MovieCarousel**: Filtra por estados reales del backend
   - **Cartelera**: Filtrado dinámico por estado
   - **Dulcería**: Categorías derivadas de productos cargados
   - **DetallePelicula**: Datos reales de película y showtimes

6. **Servicios Refactorizados**
   - `moviesService.ts`: Sin fallbacks, solo backend
   - `cinemaService.ts`: Rutas relativas con `apiClient`
   - `concessionService.ts`: Gestión por cine
   - `authService.ts`: Login, register, refresh integrados
   - `showtimeService.ts`: Preparado para horarios dinámicos

---

### Fase 2 – Autenticación y Protección de Rutas

**Objetivo**: Implementar flujo completo de autenticación (login, registro, logout) y protección de rutas sensibles.

#### Implementación

1. **AuthContext** (`src/context/AuthContext.tsx`)
   - Estado global: `user`, `loading`, `isAuthenticated`
   - Métodos: `login`, `register`, `logout`, `refresh`
   - Integración con `authService` y almacenamiento de tokens

2. **Protección de Rutas** (`src/components/ProtectedRoute.tsx`)
   - Validación de autenticación y roles
   - Redirect a `/login` preservando ruta original (`from`)
   - Soporte para roles específicos (USER, ADMIN)

3. **Páginas de Autenticación**
   - **Login.tsx**: Formulario controlado, manejo de errores, redirect post-login
   - **Register.tsx**: Validación de contraseñas, redirect a login tras registro

4. **Rutas Protegidas**
   - Confirmación de compra
   - Carritos (entradas, dulcería, total)
   - Selección de butacas
   - Métodos de pago
   - Perfil de usuario

#### Seguridad
- Tokens JWT almacenados de forma segura
- Refresh automático transparente
- Validación de roles en frontend (reforzada en backend)

---

### Fase 3 – State Management Global y Data Fetching

**Objetivo**: Estandarizar obtención/caché de datos con React Query y crear stores globales para carrito y selección de asientos.

#### React Query - Configuración

**QueryClient** (`src/lib/queryClient.ts`)
```typescript
{
  refetchOnWindowFocus: false,
  staleTime: 60000, // 1 minuto base
  retry: 1
}
```

#### Custom Hooks Implementados

| Hook | Propósito | StaleTime | Características |
|------|-----------|-----------|-----------------|
| `useMovies(params)` | Películas paginadas con filtros | 2min | Paginación, status, genre, búsqueda |
| `useAllMovies()` | Lista completa para banners | 2min | Sin paginación |
| `useCinemas()` | Listado de cines | 10min | Baja frecuencia de cambio |
| `useConcessions(cinemaId)` | Productos por cine | 5min | Activación condicional |
| `useShowtimes(params)` | Horarios por película/cine/fecha | 1min | Alta volatilidad |
| `useOccupiedSeats(showtimeId)` | Asientos ocupados en tiempo real | Polling | Actualización continua |

#### Zustand Stores

**Cart Store** (`src/store/cartStore.ts`)
```typescript
interface CartState {
  tickets: Array<{ seatId, showtimeId, price }>
  concessions: Array<{ productId, quantity, price }>
  promotionCode?: string
  
  // Acciones
  addTicket, removeTicket
  addConcession, updateConcession, removeConcession
  applyPromotion, clearPromotion
  clearCart
  
  // Selectores derivados
  ticketsTotal, concessionsTotal, discountTotal, grandTotal
}
```

**Seat Selection Store** (`src/store/seatSelectionStore.ts`)
```typescript
interface SeatSelectionState {
  selections: Record<showtimeId, {
    seatCodes: string[]
    expiresAt?: number
  }>
  
  // Acciones
  setShowtime, toggleSeat, clearSelection
  
  // Constantes
  RESERVATION_WINDOW_MS = 10 * 60 * 1000 // 10 minutos
}
```

**Showtime Selection Store** (`src/store/showtimeSelectionStore.ts`)
```typescript
interface ShowtimeSelectionState {
  showtimeId?: string
  movieId?: string
  cinemaId?: string
  date?: string
  time?: string
  format?: string
  price?: number
  
  setSelection, clearSelection
}
```

#### Beneficios
- Eliminación de duplicación de lógica de fetch
- Caché reutilizable acelera navegación
- Separación clara: datos remotos (React Query) vs estado transaccional (Zustand)
- Base para prefetch estratégico

---

### Fase 4 – Selección de Asientos y Reservas Temporales

**Objetivo**: Integrar lógica real de selección de asientos con persistencia temporal y evitar condiciones de carrera.

#### Servicios de Asientos

**Endpoints Consumidos** (`src/services/seatService.ts`)

| Endpoint | Método | Propósito | Respuesta |
|----------|--------|-----------|-----------|
| `/showtimes/{id}/seats/occupied` | GET | Obtener códigos ocupados | `string[]` |
| `/showtimes/{id}/seats/reserve` | POST | Reservar temporalmente | Fallidos en conflicto |
| `/showtimes/{id}/seats/release` | POST | Liberar reservas | `204` |
| `/showtimes/{id}/seats/confirm` | POST | Confirmar como ocupados | `204` |

#### Flujo de Selección

1. **Inicialización**
   - Usuario selecciona película/cine/fecha/formato → deriva `showtimeId`
   - `seatSelectionStore.setCurrentShowtime(showtimeId)` inicializa bucket

2. **Visualización**
   - UI genera matriz base (layout local o remoto futuro)
   - `useOccupiedSeats(showtimeId)` con polling marca asientos no disponibles

3. **Selección**
   - Click en asiento → `toggleSeatCode(showtimeId, seatCode, max)`
   - Validación de límite por cantidad de entradas
   - Primera selección dispara `POST /seats/reserve`

4. **Expiración**
   - Timer de 60 segundos visible con countdown
   - Al expirar: `purgeExpired()` limpia selección
   - `POST /seats/release` automático si había reservas

5. **Confirmación**
   - Botón "CONFIRMAR ASIENTOS" reintenta reservas faltantes
   - `POST /seats/confirm` establece estado definitivo
   - Navegación a siguiente paso (dulcería)

#### Store Mejorado

**Características Avanzadas**:
- Persistencia en `localStorage` (sobrevive refresh)
- Gestión multi-showtime (varias pestañas)
- Tracking de `reservedCodes` y `failedCodes`
- Expiración automática con limpieza

#### Página de Butacas (`src/pages/Butacas.tsx`)

**Componentes visuales**:
- Matriz de asientos con estado (disponible, ocupado, seleccionado, reservado)
- Leyenda de estados
- Countdown de expiración
- Contador de asientos seleccionados
- Botón de confirmación con validación

---

### Fase 5 – Métodos de Pago y Perfil

**Objetivo**: Gestión completa de métodos de pago y edición de perfil de usuario.

#### Métodos de Pago

**Servicio** (`src/services/paymentMethodService.ts`)
```typescript
getPaymentMethods(userId: string)
addPaymentMethod(userId: string, method: PaymentMethodRequest)
deletePaymentMethod(userId: string, methodId: string)
setDefaultPaymentMethod(userId: string, methodId: string)
```

**Hook** (`src/hooks/usePaymentMethods.ts`)
- Caché de 5 minutos
- Mutaciones optimistas para mejor UX
- Invalidación automática tras cambios

**Página** (`src/pages/PaymentMethodsPage.tsx`)
- Lista de tarjetas guardadas
- Formulario de nueva tarjeta
- Marcar como predeterminada
- Eliminación con confirmación

#### Perfil de Usuario

**Servicio** (`src/services/userService.ts`)
```typescript
getUserProfile(userId: string)
updateUserProfile(userId: string, data: UserUpdateRequest)
```

**Página** (`src/pages/ProfileEditPage.tsx`)
- Edición de nombre, email, teléfono
- Validación de formulario
- Actualización optimista

#### Prefetch Estratégico

```typescript
// Tras login exitoso
await queryClient.prefetchQuery({
  queryKey: ['paymentMethods', userId],
  queryFn: () => getPaymentMethods(userId)
})
```

---

### Fase 6 – Resiliencia y Manejo de Errores

**Objetivo**: Captura centralizada de errores y experiencia consistente ante fallos.

#### Error Boundary

**Componente** (`src/components/ErrorBoundary.tsx`)
```typescript
class ErrorBoundary extends React.Component {
  // Captura errores de render
  // Muestra UI de fallback
  // Log para debugging
  // Botón de reinicio
}
```

**Implementación en App**:
```typescript
<ErrorBoundary>
  <AuthProvider>
    <QueryClientProvider>
      <App />
    </QueryClientProvider>
  </AuthProvider>
</ErrorBoundary>
```

#### Sistema de Notificaciones

**ToastProvider** (`src/components/ToastProvider.tsx`)
- Notificaciones de éxito/error/info
- Auto-dismiss configurable
- Stack de múltiples toasts
- Animaciones suaves

**Uso**:
```typescript
const { showToast } = useToast()

showToast('Asientos confirmados', 'success')
showToast('Error al procesar pago', 'error')
```

---

## Flujo Completo de Compra

### 1. Selección de Película y Función

**Páginas**: `Cartelera.tsx`, `DetallePelicula.tsx`

1. Usuario navega cartelera filtrada por estado
2. Selecciona película → vista de detalle
3. Elige cine, fecha, formato
4. Sistema deriva `showtimeId` vía `useShowtimes`
5. Guarda selección en `showtimeSelectionStore`
6. Navegación a `/butacas/{showtimeId}`

### 2. Selección y Confirmación de Asientos

**Página**: `Butacas.tsx`

1. Carga ocupados actuales (`useOccupiedSeats`)
2. Usuario selecciona asientos (max según entradas)
3. Primera selección → reserva temporal automática
4. Countdown de 60s visible
5. Usuario confirma → `POST /seats/confirm`
6. Navegación a `/carrito/dulceria`

**Estados de asiento**:
- `available`: Disponible para selección
- `selected`: Seleccionado por usuario actual
- `reserved`: Reservado temporalmente
- `occupied`: Confirmado/vendido

### 3. Dulcería (Opcional)

**Página**: `CarritoDulceria.tsx`

1. Carga productos por cine (`useConcessions`)
2. Usuario agrega productos con cantidad
3. `cartStore.addConcession()` / `updateConcession()`
4. Navegación a `/carrito/entradas` o `/carrito/total`

### 4. Resumen de Entradas

**Página**: `CarritoEntradas.tsx`

1. Muestra asientos confirmados agrupados
2. Desglose de precios por entrada
3. Opción de volver a dulcería
4. Navegación a `/carrito/total`

### 5. Pago y Finalización

**Página**: `CarritoTotal.tsx`

1. Resumen completo (tickets + concesiones)
2. Aplicación de código promocional
3. Selección de método de pago
4. Validación de totales
5. `POST /orders/confirm` con payload:
```typescript
{
  userId: string
  items: Array<{
    type: 'TICKET' | 'CONCESSION'
    showtimeId?: string
    seatCode?: string
    concessionId?: string
    quantity: number
    unitPrice: number
  }>
  paymentMethodId: string
  promotionCode?: string
  total: number
}
```
6. Navegación a `/confirmacion/{orderId}`

### 6. Confirmación

**Página**: `Confirmacion.tsx`

1. Polling de estado si `paymentStatus === 'PENDING'`
2. Muestra orden completa con `purchaseNumber`
3. Descarga de PDF/QR (futuro)
4. Enlace a historial de órdenes

### 7. Historial

**Página**: `OrdersPage.tsx`

1. Lista de compras del usuario (`useOrders`)
2. Filtros por fecha, estado
3. Detalle de cada orden
4. Re-descarga de tickets

---

## Arquitectura de Datos

### Flujo de Información

```
Backend API
    ↓
apiClient (interceptors, refresh)
    ↓
Services (moviesService, seatService, etc.)
    ↓
React Query Hooks (useMovies, useSeats, etc.)
    ↓
Components
```

### Estado Global

```
Zustand Stores
    ├── cartStore (tickets, concessions, promotion)
    ├── seatSelectionStore (selección temporal + expiración)
    └── showtimeSelectionStore (función elegida)

React Context
    └── AuthContext (user, tokens, auth methods)
```

### Caché Strategy

| Recurso | StaleTime | RefetchInterval | Invalidación |
|---------|-----------|-----------------|--------------|
| Películas | 2min | - | Manual (admin) |
| Cines | 10min | - | Manual (admin) |
| Concesiones | 5min | - | Manual (admin) |
| Showtimes | 1min | - | Cada navegación |
| Asientos Ocupados | 30s | 30s (polling) | Post-reserva |
| Métodos de Pago | 5min | - | Post-mutación |
| Órdenes | 2min | - | Post-creación |

---

## Endpoints del Backend - Referencia Completa

### Películas

```typescript
GET    /api/movies?page=0&size=10&status=NOW_PLAYING&genre=ACTION&q=search
GET    /api/movies/now-playing
GET    /api/movies/upcoming
GET    /api/movies/presale
GET    /api/movies/{id}
POST   /api/movies              [ADMIN]
PUT    /api/movies/{id}         [ADMIN]
DELETE /api/movies/{id}         [ADMIN]
```

### Cines y Salas

```typescript
GET    /api/cinemas
GET    /api/cinemas/{id}
GET    /api/theaters?cinemaId={id}
POST   /api/cinemas             [ADMIN]
POST   /api/theaters            [ADMIN]
```

### Showtimes

```typescript
GET    /api/showtimes?cinema={id}&movie={id}&date=YYYY-MM-DD&format=2D
GET    /api/showtimes/{id}
POST   /api/showtimes           [ADMIN]
```

### Asientos

```typescript
GET    /api/showtimes/{id}/seats/occupied
POST   /api/showtimes/{id}/seats/reserve    { seatCodes: string[] }
POST   /api/showtimes/{id}/seats/release    { seatCodes: string[] }
POST   /api/showtimes/{id}/seats/confirm    { seatCodes: string[] }
```

### Concesiones

```typescript
GET    /api/concessions?cinemaId={id}&category=SNACKS
GET    /api/concessions/{id}
POST   /api/concessions         [ADMIN]
PUT    /api/concessions/{id}    [ADMIN]
DELETE /api/concessions/{id}    [ADMIN]
```

### Promociones

```typescript
GET    /api/promotions
GET    /api/promotions/{id}
GET    /api/promotions/code/{code}
POST   /api/promotions/validate?code=XXX&baseAmount=100
POST   /api/promotions          [ADMIN]
PUT    /api/promotions/{id}     [ADMIN]
DELETE /api/promotions/{id}     [ADMIN]
```

### Autenticación

```typescript
POST   /api/auth/register       { username, email, password }
POST   /api/auth/login          { usernameOrEmail, password }
POST   /api/auth/refresh        { refreshToken }
```

**Respuesta Login/Refresh**:
```typescript
{
  accessToken: string
  refreshToken: string
  user: {
    id: string
    username: string
    email: string
    role: 'USER' | 'ADMIN'
  }
}
```

### Órdenes

```typescript
GET    /api/orders              [ADMIN]
GET    /api/orders/{id}         [ADMIN | Owner]
GET    /api/orders/user/{userId}
POST   /api/orders/preview      { userId, items, promotionCode? }
POST   /api/orders/confirm      { userId, items, paymentMethodId, promotionCode?, total }
PATCH  /api/orders/{id}/cancel
PATCH  /api/orders/{id}/status  [ADMIN]

GET    /api/orders/{id}/invoice.pdf
GET    /api/orders/{id}/items/{itemId}/ticket/qr
GET    /api/orders/{id}/items/{itemId}/ticket/pdf
PATCH  /api/orders/{id}/items/{itemId}/use    [ADMIN]
```

**Estructura de Item**:
```typescript
{
  type: 'TICKET' | 'CONCESSION'
  showtimeId?: string          // Solo TICKET
  seatCode?: string            // Solo TICKET
  concessionId?: string        // Solo CONCESSION
  quantity: number
  unitPrice: number
}
```

### Métodos de Pago

```typescript
GET    /api/users/{userId}/payment-methods
POST   /api/users/{userId}/payment-methods
       { cardNumber, cardHolder, expiryDate, cvv, isDefault }
DELETE /api/users/{userId}/payment-methods/{methodId}
PATCH  /api/users/{userId}/payment-methods/{methodId}/default
```

### Usuarios

```typescript
GET    /api/users/{id}/name
GET    /api/users/{id}/profile
PUT    /api/users/{id}/profile  { name?, email?, phone? }
```

---

## Modelos de Datos TypeScript

### Movie

```typescript
interface Movie {
  id: string
  title: string
  description: string
  duration: number  // minutos
  genre: string
  rating: string
  status: 'NOW_PLAYING' | 'UPCOMING' | 'PRESALE'
  releaseDate: string  // ISO 8601
  posterUrl: string
  trailerUrl?: string
  director: string
  cast: string[]
  formats: ('2D' | '3D' | 'IMAX')[]
}
```

### Showtime

```typescript
interface Showtime {
  id: string
  movieId: string
  cinemaId: string
  theaterId: string
  date: string      // YYYY-MM-DD
  time: string      // HH:mm
  format: '2D' | '3D' | 'IMAX'
  price: number
  availableSeats: number
}
```

### Seat

```typescript
interface Seat {
  code: string      // ej: "A5"
  row: string
  column: number
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED'
  type?: 'STANDARD' | 'VIP' | 'PREMIUM'
}
```

### Order

```typescript
interface Order {
  id: string
  userId: string
  purchaseNumber: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED'
  total: number
  discount: number
  createdAt: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  type: 'TICKET' | 'CONCESSION'
  
  // Ticket fields
  showtimeId?: string
  seatCode?: string
  movieTitle?: string
  cinemaName?: string
  theaterName?: string
  showDate?: string
  showTime?: string
  
  // Concession fields
  concessionId?: string
  concessionName?: string
  
  quantity: number
  unitPrice: number
  subtotal: number
  used?: boolean
}
```

### Promotion

```typescript
interface Promotion {
  id: string
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minPurchaseAmount: number
  maxDiscount?: number
  validFrom: string
  validUntil: string
  active: boolean
  usageLimit?: number
  usageCount: number
}
```

---

## Seguridad

### Autenticación JWT

**Tokens**:
- **Access Token**: Corta duración (15min), enviado en header `Authorization: Bearer {token}`
- **Refresh Token**: Larga duración (7 días), usado solo para renovar access token

**Flujo de Refresh**:
1. Interceptor detecta 401 en `apiClient`
2. Intenta `POST /auth/refresh` con refresh token
3. Si exitoso: actualiza tokens y reintenta request original
4. Si falla: logout y redirect a login

**Almacenamiento**:
```typescript
// localStorage con prefijos
'auth_access_token'
'auth_refresh_token'
```

### Protección de Rutas

```typescript
<ProtectedRoute requiredRole="USER">
  <Component />
</ProtectedRoute>
```

Valida:
- Usuario autenticado
- Token válido
- Rol suficiente (USER < ADMIN)

### Validación de Totales

⚠️ **Importante**: El frontend solo muestra estimaciones. El backend SIEMPRE recalcula y valida:
- Precios de tickets según showtime
- Precios de concesiones
- Aplicación de promoción
- Total final

---

## Optimizaciones y Mejores Prácticas

### Prefetch Estratégico

```typescript
// Tras login
queryClient.prefetchQuery(['movies', { status: 'NOW_PLAYING' }])
queryClient.prefetchQuery(['cinemas'])
queryClient.prefetchQuery(['paymentMethods', userId])

// Al seleccionar cine
queryClient.prefetchQuery(['concessions', cinemaId])

// Al ver película
queryClient.prefetchQuery(['showtimes', { movieId, cinemaId }])
```

### Invalidaciones Inteligentes

```typescript
// Post-mutación
await createOrder(...)
queryClient.invalidateQueries(['orders', userId])
queryClient.invalidateQueries(['occupiedSeats', showtimeId])
```

### Lazy Loading de Rutas

```typescript
const Confirmacion = lazy(() => import('./pages/Confirmacion'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/confirmacion/:id" element={<Confirmacion />} />
  </Routes>
</Suspense>
```

### Debounce en Búsquedas

```typescript
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 500)

const { data } = useMovies({ q: debouncedSearch })
```

---

## Testing (Planeado)

### Unit Tests
- Utilidades y helpers
- Stores Zustand
- Hooks custom
- Componentes puros

### Integration Tests
- Flujos de autenticación
- Selección y confirmación de asientos
- Proceso completo de compra
- Aplicación de promociones

### E2E Tests (Cypress)
- Happy path: compra exitosa
- Expiración de reservas
- Conflictos de asientos
- Manejo de errores de pago

---

## Roadmap Futuro

### Corto Plazo
- [ ] WebSocket para actualizaciones de asientos en tiempo real
- [ ] Layout dinámico de salas desde backend
- [ ] Generación de PDF y QR en `Confirmacion`
- [ ] Extensión de ventana de reserva
- [ ] Sistema de notificaciones toast completo

### Mediano Plazo
- [ ] PWA con service workers
- [ ] Modo offline para consulta de historial
- [ ] Internacionalización (i18n)
- [ ] Temas claro/oscuro
- [ ] Accesibilidad (WCAG 2.1 AA)

### Largo Plazo
- [ ] Recomendaciones personalizadas (ML)
- [ ] Chat de soporte en vivo
- [ ] Integración con wallets digitales
- [ ] Programa de fidelización
- [ ] Multi-tenancy (múltiples cadenas de cines)

---

## Troubleshooting

### Problema: Asientos no se actualizan

**Causa**: Caché de React Query no invalida tras reserva

**Solución**:
```typescript
queryClient.invalidateQueries(['occupiedSeats', showtimeId])
```

### Problema: Token expirado constante

**Causa**: Refresh token inválido o expirado

**Solución**:
1. Verificar que backend emite refresh token con duración suficiente
2. Limpiar storage: `clearAuthTokens()`
3. Forzar re-login

### Problema: Reservas duplicadas

**Causa**: Race condition en selección rápida

**Solución**: Debounce en `toggleSeat` o bloqueo optimista

### Problema: Total incorrecto en preview

**Causa**: Promoción no aplicada o precio desactualizado

**Solución**: Siempre usar endpoint `/orders/preview` para cálculo final

---

## Contribución

### Setup de Desarrollo

1. Fork del repositorio
2. Clonar fork local
3. Instalar dependencias: `npm install`
4. Crear branch: `git checkout -b feature/nueva-funcionalidad`
5. Desarrollar y commitear
6. Push y crear Pull Request

### Convenciones

**Commits**: Conventional Commits
```
feat: agregar filtro de género en cartelera
fix: corregir expiración de reservas
docs: actualizar README con nuevos endpoints
refactor: simplificar lógica de carrito
```

**Branches**:
- `main`: producción estable
- `develop`: integración continua
- `feature/*`: nuevas funcionalidades
- `fix/*`: correcciones
- `hotfix/*`: parches urgentes

### Code Review

- Mínimo 1 aprobación
- Tests pasando
- Sin conflictos
- Actualización de documentación si aplica

---

## Licencia

MIT License - Ver archivo `LICENSE` para detalles.

---

## Contacto y Soporte

**Equipo de Desarrollo**: [Información de contacto]

**Issues**: [GitHub Issues](https://github.com/[org]/hdd-frontend/issues)

**Documentación Backend**: [Enlace a docs del backend]

---

_Última actualización: Noviembre 2025_
