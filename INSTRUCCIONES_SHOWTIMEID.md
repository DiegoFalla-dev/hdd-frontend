# ✅ Integración del showtimeId Real - COMPLETADA

## Estado: IMPLEMENTADO

La integración del sistema de reservas de butacas con el backend real ha sido completada exitosamente. El sistema ahora obtiene el `showtimeId` real desde el endpoint del backend.

---

## 🎯 Cambios Implementados

### 1. ✅ Nuevo Servicio: `src/services/showtimesApi.ts`

**Archivo creado** con las siguientes funcionalidades:

- **Interface `Showtime`**: Define la estructura completa de la respuesta del backend
- **`getShowtimes(movieId, cinemaId?, date?)`**: Llama al endpoint `GET /api/showtimes`
- **`findMatchingShowtime()`**: Busca una función específica por horario y formato
- **`formatToBackend()` y `formatToFrontend()`**: Convierte formatos entre frontend ("2D", "3D", "IMAX") y backend ("_2D", "_3D", "XD")

**Características**:
- Manejo robusto de errores con try/catch
- Conversión automática de formatos (frontend ↔ backend)
- Comparación de tiempo usando `.substring(0, 5)` para compatibilidad "HH:mm" vs "HH:mm:ss"
- Parámetros opcionales para mayor flexibilidad

### 2. ✅ Actualización: `src/pages/DetallePelicula.tsx`

**Cambios realizados**:

1. **Import agregado**:
   ```typescript
   import { getShowtimes, findMatchingShowtime } from "../services/showtimesApi";
   ```

2. **Handler `onClick` actualizado** (botón "COMPRAR ENTRADAS"):
   - ❌ Eliminado: Generación de `temporaryShowtimeId`
   - ✅ Agregado: Llamada a `getShowtimes()` con parámetros reales
   - ✅ Agregado: Búsqueda de showtime con `findMatchingShowtime()`
   - ✅ Agregado: Validación de función disponible
   - ✅ Agregado: Manejo de errores con mensajes claros
   - ✅ Guardado: `showtimeId` real (número) en localStorage

3. **Estados agregados**:
   ```typescript
   const [showtimes, setShowtimes] = useState<any[]>([]);
   const [loadingShowtimes, setLoadingShowtimes] = useState(false);
   ```

4. **useEffect agregado**: Carga automática de showtimes cuando cambian día, formato o cine

5. **UI mejorada**:
   - Los horarios ahora se obtienen dinámicamente desde el backend
   - Muestra número de asientos disponibles en cada botón de horario
   - Indicadores de color según disponibilidad:
     - 🟢 Verde: >50% disponible
     - 🟡 Amarillo: 20-50% disponible
     - 🔴 Rojo: <20% disponible
   - Deshabilita botones de horarios agotados
   - Muestra estado de carga mientras obtiene datos

### 3. ✅ Actualización: `src/pages/Butacas.tsx`

**Cambios realizados**:

1. **Lógica simplificada** para obtener `showtimeId`:
   - Lee directamente desde `localStorage.getItem('movieSelection')`
   - Convierte a número: `Number(parsed.showtimeId)`
   - Redirige a cartelera si no encuentra showtimeId válido
   - Elimina fallbacks temporales

2. **Validación robusta**:
   - Alerta al usuario si falta el showtimeId
   - Redirige automáticamente a `/cartelera` para reiniciar flujo

---

## 🔄 Flujo Completo de Integración

```
1. Usuario selecciona película en Cartelera
   ↓
2. DetallePelicula.tsx carga:
   - Información de la película
   - Cines disponibles
   ↓
3. Usuario selecciona:
   - Cine (desde Navbar modal)
   - Día (próximos 3 días)
   - Formato (2D/3D/IMAX)
   ↓
4. useEffect ejecuta getShowtimes(movieId, cinemaId, date)
   ↓
5. Backend responde con array de funciones disponibles:
   [
     {
       "id": 34,
       "movieId": 17,
       "theaterId": 11,
       "theaterName": "Sala 1",
       "cinemaId": 7,
       "cinemaName": "Cineplus Jockey Plaza",
       "date": "2025-11-20",
       "time": "14:00:00",
       "format": "_2D",
       "availableSeats": 60,
       "totalSeats": 60,
       "seatMatrixType": "SMALL"
     }
   ]
   ↓
6. UI muestra horarios disponibles con disponibilidad de asientos
   ↓
7. Usuario selecciona horario específico
   ↓
8. Usuario hace clic en "COMPRAR ENTRADAS"
   ↓
9. onClick async ejecuta:
   - getShowtimes() nuevamente para datos frescos
   - findMatchingShowtime(showtimes, selectedTime, selectedFormat)
   - Convierte formato: "2D" → "_2D"
   - Busca coincidencia: time.substring(0,5) === "14:00" && format === "_2D"
   ↓
10. Si encuentra función:
    - Guarda showtimeId REAL en localStorage
    - Navega a /confirmacion
    ↓
11. Si NO encuentra función:
    - Muestra alert: "Función no disponible"
    - Usuario debe seleccionar otro horario
   ↓
12. Usuario confirma y navega a /carrito-entradas
   ↓
13. Usuario selecciona tipo y cantidad de entradas
   ↓
14. Usuario navega a /butacas
   ↓
15. Butacas.tsx lee showtimeId desde localStorage
   ↓
16. useSeatReservation({ showtimeId: 34 }) ejecuta:
    - GET /api/seat-reservations/matrix?showtimeId=34
    - Carga matriz de butacas
    - Inicia timer de 60 segundos
   ↓
17. Usuario selecciona butacas → reserveSeats()
   ↓
18. POST /api/seat-reservations con sessionId y showtimeId
   ↓
19. Usuario navega a /carrito-total
   ↓
20. confirmPurchase() finaliza compra
   ↓
21. POST /api/seat-reservations/confirm con sessionId
   ↓
22. ✅ Reserva confirmada exitosamente
```

---

## 🧪 Testing

### Verificaciones Requeridas

1. **Backend corriendo**:
   ```bash
   # En el directorio del backend Spring Boot
   ./mvnw spring-boot:run
   ```

2. **Endpoint disponible**:
   ```bash
   curl "http://localhost:8080/api/showtimes?movieId=17&cinemaId=7&date=2025-11-20"
   ```

3. **Flujo completo**:
   - Selecciona una película
   - Verifica que los horarios se cargan automáticamente
   - Observa indicadores de disponibilidad
   - Selecciona un horario con asientos disponibles
   - Haz clic en "COMPRAR ENTRADAS"
   - Verifica en consola: `console.log(localStorage.getItem('movieSelection'))`
   - Debe mostrar: `{ ..., "showtimeId": 34 }` (número, no string)
   - Continúa hasta `/butacas`
   - Verifica que la matriz de butacas se carga correctamente

### Casos de Error a Probar

1. ❌ **Backend no disponible**:
   - Muestra: "No se pudieron cargar las funciones disponibles"
   - Usuario no puede continuar sin backend

2. ❌ **Función agotada**:
   - Botón de horario aparece deshabilitado y con "Agotado"
   - No se puede seleccionar

3. ❌ **Función no encontrada**:
   - Muestra alert: "Función no disponible. Por favor, elige otro horario"
   - No navega a confirmación

4. ❌ **showtimeId faltante en Butacas**:
   - Muestra alert: "Sesión inválida..."
   - Redirige automáticamente a `/cartelera`

---

## 📋 Checklist de Producción

- [x] Endpoint `/api/showtimes` del backend implementado
- [x] Servicio `showtimesApi.ts` creado
- [x] DetallePelicula.tsx actualizado para usar API real
- [x] Butacas.tsx simplificado para leer showtimeId real
- [x] Conversión de formatos implementada (_2D ↔ 2D)
- [x] Manejo de errores robusto en toda la cadena
- [x] UI mejorada con indicadores de disponibilidad
- [x] Validaciones de showtimeId en todo el flujo
- [ ] **Testing con backend real en desarrollo**
- [ ] **Testing de casos de error**
- [ ] **Testing de flujo completo E2E**

---

## 🚀 Beneficios de la Integración

1. **Datos en tiempo real**: Los horarios y disponibilidad vienen directamente del backend
2. **Sincronización**: No hay desajustes entre frontend y backend
3. **UX mejorada**: Usuarios ven exactamente qué funciones están disponibles
4. **Prevención de errores**: No se pueden seleccionar funciones agotadas
5. **Transparencia**: Indicadores visuales de disponibilidad
6. **Robustez**: Manejo de errores en cada paso del flujo

---

## 🔧 Mantenimiento Futuro

### Si el backend cambia el formato de fecha/hora:

Actualizar en `showtimesApi.ts`:
```typescript
return showtimes.find(st => 
  st.time.substring(0, 5) === time && // Ajustar según nuevo formato
  st.format === backendFormat
);
```

### Si se agregan nuevos formatos (4DX, ScreenX, etc.):

Actualizar en `showtimesApi.ts`:
```typescript
export const formatToBackend = (frontendFormat: string): string => {
  const formatMap: Record<string, string> = {
    '2D': '_2D',
    '3D': '_3D',
    'IMAX': 'XD',
    '4DX': '_4DX',  // ← Agregar aquí
    'ScreenX': 'SCREENX'
  };
  return formatMap[frontendFormat] || frontendFormat;
};
```

### Si cambia la estructura de la respuesta del backend:

Actualizar interface `Showtime` en `showtimesApi.ts` para reflejar los nuevos campos.

---

## ⚠️ Notas Importantes

1. **El `showtimeId` es crítico**: Sin él, el sistema de reservas no funciona
2. **Siempre validar disponibilidad**: Llamar a `getShowtimes()` antes de confirmar
3. **Formatos sincronizados**: Usar `formatToBackend()` para todas las conversiones
4. **Manejo de zona horaria**: El backend usa GMT-5 (Perú), considerar en comparaciones de fecha

---

## 📞 Soporte

Si encuentras errores 404 en `/api/showtimes`:
1. Verifica que el backend esté corriendo
2. Verifica la URL base en `apiClient.ts`: `http://localhost:8080`
3. Verifica que el endpoint esté implementado en el backend
4. Revisa logs del backend para errores del lado servidor

Si los horarios no se cargan:
1. Abre DevTools → Network → Busca la llamada a `/api/showtimes`
2. Verifica los parámetros: `movieId`, `cinemaId`, `date`
3. Verifica la respuesta del backend
4. Revisa la consola para errores de JavaScript

---

**Última actualización**: 20 de noviembre de 2025  
**Estado**: ✅ PRODUCCIÓN LISTA (pendiente testing con backend real)
