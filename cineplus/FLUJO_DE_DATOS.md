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

4. **Reservas/Boletos**
   ```
   POST /api/bookings → Crear nueva reserva
   GET /api/bookings/{id} → Obtener detalles de reserva
   PUT /api/bookings/{id}/confirm → Confirmar reserva
   ```

5. **Dulcería**
   ```
   GET /api/concessions?cinema={id} → Productos por cine
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
      "rows": 13,
      "cols": 17,
      "totalSeats": 221,
      "availableSeats": 180
    }
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
**Método**: Redirección simple
```
/carrito
```
**Nota**: Los datos de la reserva deberán persistirse en el backend o localStorage antes de la redirección.

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

## Notas para Migración
1. Mantener la misma estructura de interfaces TypeScript
2. Reemplazar imports de archivos .ts por llamadas a APIs
3. Implementar loading states para llamadas asíncronas
4. Mantener localStorage para preferencias de usuario (cine seleccionado)
5. Considerar caché para datos que no cambian frecuentemente (películas, cines)
6. **URL Parameters**: Mantener el sistema de parámetros URL para transferencia de datos entre páginas
7. **Formateo de fechas**: Implementar función `formatDate()` en el backend para consistencia
8. **Validación**: Validar parámetros URL en SeleccionBoletos antes de mostrar contenido