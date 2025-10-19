# Flujo de Datos - CinePlus Frontend

## Resumen General
Este documento explica cómo funciona el sistema de datos en el frontend de CinePlus, preparado para la futura integración con Spring Boot backend.

## Estructura de Archivos de Datos

### 1. `peliculas.ts`
**Propósito**: Información básica de películas (catálogo general)
```typescript
interface Pelicula {
  id: string;
  titulo: string;
  sinopsis: string;
  genero: string;
  clasificacion: string;
  duracion: string;
  imagenCard?: string;
  banner?: string;
}
```

### 2. `cinemasSchedule.ts`
**Propósito**: Horarios específicos por cine y gestión de salas
```typescript
interface Showtime {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  format: '2D' | '3D' | 'XD';
  seatMatrix: 'small' | 'medium' | 'large' | 'xlarge';
  availableSeats: number;
  totalSeats: number;
}

interface Cinema {
  id: string;
  name: string;
  movies: CinemaMovie[];
}
```

### 3. `dulceria.ts` + `cinesDulceria.ts`
**Propósito**: Productos de dulcería por cine
- `dulceria.ts`: Catálogo general de productos
- `cinesDulceria.ts`: Productos disponibles por cine específico

## Flujo Completo de Usuario

### Paso 1: DetallePelicula - Carga Inicial
```
Usuario accede → /detalle?pelicula=1
↓
Se obtiene película de peliculas.ts usando ID
↓
Se verifica si hay cine seleccionado en localStorage
```

### Paso 2: DetallePelicula - Selección de Cine
```
Si NO hay cine seleccionado:
- Muestra skeleton de la página
- Abre SideModal con lista de cines
- Usuario selecciona cine → se guarda en localStorage

Si SÍ hay cine seleccionado:
- Continúa al paso 3
```

### Paso 3: DetallePelicula - Carga de Horarios Dinámicos
```
Se ejecutan funciones de cinemasSchedule.ts:

getAvailableDates() → Genera próximos 3 días desde hoy (GMT-5)
↓
getMovieShowtimes(cineName, movieId) → Obtiene horarios del cine específico
↓
Se extraen formatos únicos disponibles [2D, 3D, XD]
```

### Paso 4: DetallePelicula - Selección de Horario (3 pasos obligatorios)
```
1. Usuario selecciona DÍA → se habilitan formatos
2. Usuario selecciona FORMATO → se habilitan horarios
3. Usuario selecciona HORA → se habilita botón "Comprar Entradas"

Filtrado inteligente:
- Solo muestra horarios futuros (2h buffer para películas del día actual)
- Horarios varían según el cine seleccionado
```

### Paso 5: Redirección a SeleccionBoletos
```
Usuario hace click en "COMPRAR ENTRADAS"
↓
Redirección con parámetros URL:
/boletos?pelicula={id}&day={date}&time={time}&format={format}
```

### Paso 6: SeleccionBoletos - Confirmación
```
Página recibe parámetros URL:
- pelicula: ID de la película
- day: Fecha seleccionada (YYYY-MM-DD)
- time: Hora seleccionada (HH:MM)
- format: Formato seleccionado (2D/3D/XD)

Se obtiene:
- Información de película desde peliculas.ts
- Cine seleccionado desde localStorage

Se muestra:
- Resumen completo de la selección
- Mensaje de confirmación
- Botón "CONTINUAR" → redirige a /carrito
```

### Paso 7: Carrito - Selección de Entradas
```
Página de carrito con funcionalidad completa:

Tipos de entrada disponibles:
- GENERAL: Promo Online, Persona con Discapacidad, Silla de Ruedas, Niño, Adulto
- CONVENIOS: 50% DCTO Banco Ripley

Funcionalidades:
- Agregar entradas: Click en "+" o botón principal
- Modificar cantidad: Botones "+" y "-" 
- Eliminar entrada: Al llegar cantidad a 0, se elimina automáticamente
- Cálculo dinámico del total
- Botón CONTINUAR:
  * Sin entradas: Gris, cursor not-allowed, no funcional
  * Con entradas: Blanco, cursor pointer, redirige a /butacas

Panel lateral muestra:
- Información de película (imagen, título, formato)
- Datos del cine y horario
- Lista de entradas seleccionadas con controles
- Total calculado dinámicamente
```

### Paso 8: Butacas - Selección de Asientos
```
Página de selección de asientos con matriz dinámica:

Matriz de asientos:
- Basada en SEAT_MATRICES (small, medium, large, xlarge)
- Determinada por el showtime específico del cine
- Etiquetas de filas (A-Q) al lado izquierdo
- Números de asientos en cada botón

Estados de asientos:
- Disponible: Blanco, clickeable
- Ocupado: Gris, no clickeable (30% aleatorio)
- Seleccionado: Azul, clickeable para deseleccionar

Validaciones:
- Solo permite seleccionar el número exacto de entradas compradas
- Muestra contador de asientos seleccionados vs requeridos
- Botón CONTINUAR habilitado solo cuando se completa la selección

Panel lateral muestra:
- Resumen completo del carrito
- Información de película y horario
- Lista de entradas con precios
- Total final
```

### Paso 9: CarritoDulceria - Selección de Productos
```
Página de dulcería con productos específicos por cine:

Categorías de productos:
- COMBOS: Paquetes con múltiples productos
- CANCHITA: Diferentes tamaños y sabores
- BEBIDAS: Gaseosas, jugos, agua
- SNACKS: Hot dogs, nachos, hamburguesas, etc.

Funcionalidades:
- Productos varían según el cine seleccionado
- Tabs para navegar entre categorías
- Agregar productos al carrito con botón "+"
- Modificar cantidades con controles "+" y "-"
- Banner promocional de dulcería

Panel lateral muestra:
- Resumen completo: película, cine, entradas, asientos
- Lista de productos de dulcería agregados
- Cargo por servicio de confitería
- Total general actualizado
```

### Paso 10: PasarelaPagos - Procesamiento de Pago
```
Página final de pago con generación de PDF:

Métodos de pago:
- Tarjeta de crédito/débito (campos: número, titular, CVV, expiración)
- Yape (simulado)

Opciones:
- "NECESITO BOLETA DE VENTA CON DATOS" (checkbox)
- Términos y condiciones (obligatorio)

Validaciones:
- Campos de tarjeta completos (si se selecciona tarjeta)
- Términos y condiciones aceptados

Generación de PDF:
- PDF profesional con logo CINEPLUS
- QR code con información de acceso
- Información básica: película, cine, sala, asientos, fecha, hora
- Si se marca boleta: incluye tabla detallada con entradas, productos y precios
- Descarga automática con nombre único

Datos del QR:
- Película, cine, sala, asientos, fecha, hora, formato, número de ticket
- JSON stringificado para escaneo en el cine
```

## Funciones Clave para Backend Integration

### Funciones que deberán convertirse en API calls:

1. **`getAvailableDates()`**
   - Actual: Genera fechas en frontend
   - Futuro API: `GET /api/showtimes/dates`

2. **`getMovieShowtimes(cinemaName, movieId)`**
   - Actual: Filtra datos locales
   - Futuro API: `GET /api/showtimes?cinema={id}&movie={id}`

3. **`getAvailableTimes(showtimes, date, format)`**
   - Actual: Filtra horarios en frontend
   - Futuro API: `GET /api/showtimes/times?date={date}&format={format}`

## Matrices de Asientos

### Configuración Actual:
```typescript
SEAT_MATRICES = {
  small: { rows: 13, cols: 17 },   // 221 asientos
  medium: { rows: 15, cols: 17 },  // 255 asientos  
  large: { rows: 16, cols: 22 },   // 352 asientos
  xlarge: { rows: 17, cols: 20 }   // 340 asientos
}
```

### Para Backend:
- Cada showtime tiene una `seatMatrix` asignada
- Se calcula `totalSeats` y `availableSeats`
- Necesario para selección de asientos en página de boletos

## Estados de la Aplicación

### LocalStorage:
- `selectedCine`: Nombre del cine seleccionado
- Persiste entre sesiones del usuario

### Estados de React:

**DetallePelicula:**
```typescript
const [selectedCine, setSelectedCine] = useState<string | null>(null);
const [selectedDay, setSelectedDay] = useState<string | null>(null);
const [selectedTime, setSelectedTime] = useState<string | null>(null);
const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
```

**SeleccionBoletos:**
```typescript
const [selectedCine, setSelectedCine] = useState<string | null>(null);
// Los demás datos vienen por URL parameters
const peliculaId = searchParams.get('pelicula');
const day = searchParams.get('day');
const time = searchParams.get('time');
const format = searchParams.get('format');
```

**Carrito:**
```typescript
const [selectedCine, setSelectedCine] = useState<string | null>(null);
const [entradas, setEntradas] = useState<Entrada[]>([]);
const [movieSelection, setMovieSelection] = useState<any>(null);
// Parámetros URL opcionales para contexto
const peliculaId = searchParams.get('pelicula');
const day = searchParams.get('day');
const time = searchParams.get('time');
const format = searchParams.get('format');
```

**Butacas:**
```typescript
const [selectedCine, setSelectedCine] = useState<string | null>(null);
const [entradas, setEntradas] = useState<Entrada[]>([]);
const [movieSelection, setMovieSelection] = useState<any>(null);
const [seats, setSeats] = useState<Seat[]>([]);
const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
const [seatMatrix, setSeatMatrix] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
// Datos del showtime para determinar matriz de asientos
```

**CarritoDulceria:**
```typescript
const [selectedCine, setSelectedCine] = useState<string | null>(null);
const [entradas, setEntradas] = useState<Entrada[]>([]);
const [movieSelection, setMovieSelection] = useState<any>(null);
const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
const [productos, setProductos] = useState<ProductosByCine | null>(null);
const [activeCategory, setActiveCategory] = useState<'combos' | 'canchita' | 'bebidas' | 'snacks'>('combos');
const [carritoProductos, setCarritoProductos] = useState<ProductoCarrito[]>([]);
```

**PasarelaPagos:**
```typescript
const [selectedCine, setSelectedCine] = useState<string | null>(null);
const [entradas, setEntradas] = useState<Entrada[]>([]);
const [movieSelection, setMovieSelection] = useState<any>(null);
const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
const [carritoProductos, setCarritoProductos] = useState<ProductoCarrito[]>([]);
const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'yape'>('tarjeta');
const [cardNumber, setCardNumber] = useState("");
const [cardHolder, setCardHolder] = useState("");
const [expiryDate, setExpiryDate] = useState("");
const [cvv, setCvv] = useState("");
const [needsReceipt, setNeedsReceipt] = useState(false);
const [acceptTerms, setAcceptTerms] = useState(false);
```

## Preparación para APIs de Spring Boot

### Endpoints Necesarios:

1. **Películas**
   ```
   GET /api/movies → Lista todas las películas
   GET /api/movies/{id} → Detalle de película específica
   ```

2. **Cines**
   ```
   GET /api/cinemas → Lista todos los cines
   GET /api/cinemas/{id}/movies → Películas disponibles en un cine
   ```

3. **Horarios**
   ```
   GET /api/showtimes?cinema={id}&movie={id}&date={date}
   GET /api/showtimes/{id}/seats → Estado de asientos para un horario
   ```

4. **Asientos**
   ```
   GET /api/showtimes/{id}/seats → Estado de asientos para un horario específico
   POST /api/seats/reserve → Reservar asientos temporalmente
   DELETE /api/seats/release → Liberar asientos reservados
   ```

5. **Reservas/Boletos**
   ```
   POST /api/bookings → Crear nueva reserva
   GET /api/bookings/{id} → Obtener detalles de reserva
   PUT /api/bookings/{id}/confirm → Confirmar reserva
   ```

6. **Entradas/Boletos**
   ```
   POST /api/tickets → Crear selección de entradas
   PUT /api/tickets/{id} → Actualizar entradas seleccionadas
   GET /api/tickets/types → Obtener tipos de entrada disponibles
   ```

7. **Dulcería**
   ```
   GET /api/concessions?cinema={id} → Productos por cine
   POST /api/concessions/cart → Agregar productos al carrito
   PUT /api/concessions/cart/{id} → Actualizar cantidad de productos
   DELETE /api/concessions/cart/{id} → Eliminar productos del carrito
   ```

8. **Pagos**
   ```
   POST /api/payments/process → Procesar pago
   POST /api/payments/validate → Validar datos de pago
   GET /api/payments/{id}/receipt → Generar comprobante
   ```

9. **Tickets/PDF**
   ```
   POST /api/tickets/generate → Generar PDF de entrada
   GET /api/tickets/{id}/qr → Obtener datos del QR
   POST /api/tickets/validate → Validar entrada en el cine
   ```

### Estructura de Respuesta Sugerida:
```json
{
  "showtime": {
    "id": "show123",
    "movieId": "movie1",
    "cinemaId": "cinema1", 
    "date": "2025-10-18",
    "time": "13:50",
    "format": "2D",
    "theater": {
      "id": "theater1",
      "seatMatrix": "medium",
      "rows": 15,
      "cols": 17,
      "totalSeats": 255,
      "availableSeats": 180
    },
    "seats": [
      {
        "id": "A1",
        "row": "A",
        "number": 1,
        "status": "available"
      },
      {
        "id": "A2",
        "row": "A",
        "number": 2,
        "status": "occupied"
      }
    ]
  }
}
```

## Timezone Management
- **Actual**: Lógica GMT-5 en frontend
- **Futuro**: Backend debe manejar timezone del cine
- **Filtrado**: Solo mostrar horarios válidos según hora actual

## Transferencia de Datos Entre Páginas

### DetallePelicula → SeleccionBoletos
**Método**: URL Parameters
```
/boletos?pelicula=1&day=2025-10-18&time=13:50&format=2D
```

**Datos transferidos:**
- `pelicula`: ID de película seleccionada
- `day`: Fecha en formato YYYY-MM-DD
- `time`: Hora en formato HH:MM
- `format`: Formato de proyección (2D/3D/XD)
- `selectedCine`: Persiste en localStorage

### SeleccionBoletos → Carrito
**Método**: Redirección simple + URL Parameters (opcional)
```
/carrito?pelicula={id}&day={date}&time={time}&format={format}
```
**Datos transferidos**:
- Parámetros URL opcionales para mantener contexto
- `movieSelection`: Persiste en localStorage desde DetallePelicula
- `selectedCine`: Persiste en localStorage

### Carrito → Butacas
**Método**: Redirección simple
```
/butacas
```
**Datos transferidos**:
- `selectedEntradas`: Persiste en localStorage las entradas seleccionadas
- Mantiene contexto de película, cine y horario

### Butacas → CarritoDulceria
**Método**: Redirección simple
```
/dulceria-carrito
```
**Datos transferidos**:
- `selectedSeats`: Array de asientos seleccionados (ej: ["A1", "A2"])
- `selectedEntradas`: Entradas del carrito
- Contexto completo de la reserva

### CarritoDulceria → PasarelaPagos
**Método**: Redirección simple
```
/pago
```
**Datos transferidos**:
- `carritoProductos`: Productos de dulcería seleccionados
- `selectedSeats`: Array de asientos seleccionados
- `selectedEntradas`: Entradas del carrito
- Contexto completo de la reserva

## Componentes Reutilizables

### SideModal
**Ubicación**: `src/components/SideModal.tsx`
**Uso**: Selección de cine en Navbar, DetallePelicula, y Dulceria
**Props**:
```typescript
interface SideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}
```

### Navbar Variants
**Landing**: Navbar fijo con transparencia/blur
**Boletos**: Navbar estático con fondo sólido

## LocalStorage Management

### Datos Persistentes:
```typescript
// Preferencias del usuario
localStorage.setItem("selectedCine", cineName);

// Flujo de compra (temporal)
localStorage.setItem("movieSelection", JSON.stringify(movieData));
localStorage.setItem("selectedEntradas", JSON.stringify(entradas));
localStorage.setItem("selectedSeats", JSON.stringify(seats));
localStorage.setItem("carritoProductos", JSON.stringify(productos));
```

### Limpieza de Datos:
- Datos de compra se limpian al completar el pago
- Preferencias de usuario persisten entre sesiones
- Implementar expiración para datos temporales

## PDF Generation

### Librerías Utilizadas:
- `jspdf`: Generación de PDF
- `qrcode`: Generación de códigos QR

### Estructura del PDF:
```
Header: Logo CINEPLUS + QR Code (esquina superior derecha)
Ticket Info: Número único + fecha/hora de compra
Movie Info: Título + formato + idioma
Venue Info: Cine + fecha función + sala + asientos
[Opcional] Purchase Details: Tabla con entradas, productos, precios
Footer: Términos y condiciones
```

### Datos del QR Code:
```json
{
  "pelicula": "Título de la película",
  "cine": "Nombre del cine",
  "sala": "Sala 6",
  "asientos": "A1, A2",
  "fecha": "Domingo, 18/10",
  "hora": "13:50",
  "formato": "2D",
  "ticket": "1729123456789-1"
}
```

## Notas para Migración
1. Mantener la misma estructura de interfaces TypeScript
2. Reemplazar imports de archivos .ts por llamadas a APIs
3. Implementar loading states para llamadas asíncronas
4. Mantener localStorage para preferencias de usuario (cine seleccionado)
5. Considerar caché para datos que no cambian frecuentemente (películas, cines)
6. **URL Parameters**: Mantener el sistema de parámetros URL para transferencia de datos entre páginas
7. **Formateo de fechas**: Implementar función `formatDate()` en el backend para consistencia
8. **Validación**: Validar parámetros URL en SeleccionBoletos, Carrito y Butacas antes de mostrar contenido
9. **Estado del carrito**: Implementar persistencia de entradas seleccionadas (localStorage temporal, backend definitivo)
10. **Cálculos dinámicos**: Mantener cálculo de totales en tiempo real en el frontend
11. **UX del carrito**: Preservar la funcionalidad de agregar/eliminar entradas y estados del botón CONTINUAR
12. **Matriz de asientos**: Implementar sistema de reserva temporal de asientos durante la selección
13. **Estados de asientos**: Manejar estados en tiempo real (disponible, ocupado, reservado temporalmente)
14. **Validación de asientos**: Verificar disponibilidad antes de confirmar selección
15. **Timeout de reserva**: Implementar liberación automática de asientos no confirmados
16. **Dulcería por cine**: Mantener sistema de productos específicos por ubicación
17. **Generación de PDF**: Implementar en backend con misma estructura y QR
18. **Validación de pagos**: Integrar con pasarelas de pago reales
19. **Gestión de tickets**: Sistema de validación de QR en el cine
20. **Cálculo de totales**: Incluir cargos por servicio y comisiones