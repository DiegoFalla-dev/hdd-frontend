# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Flujo de Compra – Estado Actual (Fases 4–6)

Esta sección resume el avance funcional del frontend sobre el flujo completo de venta (selección de función → asientos → dulcería → resumen/pago → confirmación → historial) alineado con el documento `FLUJO_COMPLETO_VENTA.md`.

### Fase 4 (Completada) – Selección y Confirmación de Asientos

Esta fase introduce la lógica completa de selección y confirmación de asientos integrada con el backend, reemplazando el enfoque estático inicial.

### Objetivos Clave
- Mostrar ocupación real inicial por función (showtime).
- Reservar temporalmente asientos para evitar conflictos de venta simultánea.
- Expirar reservas automáticamente (1 minuto) liberando asientos no confirmados.
- Confirmar definitivamente asientos antes de continuar al flujo de compra.

### Componentes / Cambios Principales
- `src/services/seatService.ts`: Operaciones ocupados, reservar, liberar y confirmar (`/seats/occupied`, `/seats/reserve`, `/seats/release`, `/seats/confirm`).
- `src/store/seatSelectionStore.ts`: Persistencia por `showtimeId`, expiración, tracking de `reservedCodes` y `failedCodes`.
- `src/hooks/useOccupiedSeats.ts`: Hook React Query con polling ligero para ocupados.
- `src/pages/Butacas.tsx`: Overlay de ocupados, reserva incremental, countdown y confirmación final.

### Flujo Simplificado
1. Derivar `showtimeId` desde selección de película/cine/fecha/formato.
2. Cargar ocupados y construir matriz base (remota futura o fallback local).
3. Usuario selecciona asientos → reserva temporal y refleja fallidos.
4. Countdown de 60s visible; al expirar se libera y se notifica.
5. Botón “CONFIRMAR ASIENTOS” reintenta reservas faltantes y confirma definitivos en backend.

### Mejoras Futuras (Roadmap)
- Polling/WebSocket más agresivo o invalidación manual al confirmar.
- Layout dinámico de sala entregado por backend (zonas, precios diferenciados).
- UI de error toast en lugar de `alert`.
- Extensión de ventana de reserva configurable.

Para detalles técnicos completos ver `docs/fases/Fase4.md`.

### Fase 5 – Métodos de Pago y Perfil (Parcialmente Implementada)
- `src/services/paymentMethodService.ts`, `src/hooks/usePaymentMethods.ts`: CRUD y manejo de método por defecto.
- `src/pages/PaymentMethodsPage.tsx`: UI para listar, agregar y eliminar métodos.
- `src/pages/ProfileEditPage.tsx`: Stub inicial para edición de perfil (pendiente integración backend completa).
- Prefetch de métodos de pago tras login para acelerar render del carrito final.

### Fase 6 – Resiliencia / Error Boundary (Seed)
- `src/components/ErrorBoundary.tsx` envuelve `<App/>` capturando errores de render y mostrando fallback.
- Punto de extensión para: logging remoto, reintentos y clasificación de errores.

### Migración de Estado: LocalStorage → Zustand + React Query
Se reemplazaron claves legacy (`movieSelection`, `selectedCine`, `carritoProductos`, `selectedEntradas`, `selectedSeats`) por stores y hooks centralizados.

Nuevos stores / hooks:
- `showtimeSelectionStore.ts`: Selección estructurada de función (showtimeId, movieId, cinemaId, date, time, format, price).
- `seatSelectionStore.ts`: Gestión temporal + expiración de selección de asientos por showtime.
- `cartStore.ts`: TicketGroups (asientos confirmados futuros) y concesiones, totales y promoción.
- `useOrders.ts`: Historial de compras del usuario autenticado.
- `useOrder.ts`: Polling dinámico mientras `paymentStatus==='PENDING'`.

### Flujo Actual Paso a Paso
1. Usuario selecciona película/cine/fecha/formato en `DetallePelicula` → se deriva showtime real y se guarda en `showtimeSelectionStore` → navegación a `/butacas/{showtimeId}`.
2. En `Butacas` se manejan asientos: reserva temporal, expiración, confirmación y paso a dulcería.
3. `CarritoEntradas` agrupa entradas (transición: aún formateo local, pendiente estandarización de DTO para envío de tickets).
4. `CarritoDulceria` agrega productos vía `cartStore` sin usar localStorage.
5. `CarritoTotal` (pago) construirá payload final (ya soporta confirmación y navigation a `/confirmacion/:orderId`).
6. `Confirmacion` recupera orden por ID y muestra estado con polling si está pendiente.
7. `OrdersPage` lista historial y enlaza a confirmaciones.

### Endpoints Asumidos / Ajustables
- `/showtimes?...` para derivar función.
- `/showtimes/{id}/seats/*` para operaciones de reserva y confirmación (futuros ajustes si backend define prefijos distintos).
- `/orders/preview`, `/orders/confirm`, `/orders/{id}` y `/users/{id}/purchases` para órdenes y historial.
- `/users/{id}/payment-methods` para métodos de pago.

### Limpieza de Legacy
Archivo `utils/storage.ts` mantiene stubs no operativos de selección (deprecados) y conserva sólo helpers de token (`getAccessToken`, etc.). Cualquier nuevo flujo debe usar stores y hooks.

### Próximas Mejoras Planeadas
- Normalizar DTO de tickets individuales para construir `items` del pago siguiendo estructura backend (TICKET vs CONCESSION).
- Incorporar `sessionId` de reserva temporal al payload `/payments/process` (cuando backend exponga endpoint definitivo en esta rama).
- Reemplazar `alert()` por sistema de notificaciones (toast).
- Documentar contrato final de pago y estados (`PENDING`, `COMPLETED`, `FAILED`).
- Soporte de cancelación / reintento de pago y actualización del estado en `OrdersPage`.

### Consideraciones de Seguridad
- Autenticación JWT centralizada en `authService.ts` con almacenamiento seguro (prefijo, separación de access/refresh tokens).
- Evitar exponer purchaseNumber antes de confirmación; se obtiene desde backend tras pago exitoso.
- Validación de totales: el backend recalcula y valida monto (el frontend solo muestra estimación).

### Cómo Extender
1. Añadir WebSocket para actualizaciones de asientos → reemplazar polling/intervals.
2. Recetas de promoción: extender `Promotion` y cálculo de `discountTotal` en `cartStore`.
3. Generación de PDF / QR desde `Confirmacion` usando `purchaseNumber` (base ya presente con librerías instaladas: `jspdf`, `qrcode`).

---
## Changelog Resumido
- F4: Selección y confirmación de asientos funcional con expiración.
- F5: CRUD métodos de pago + perfil (stub).
- F6: ErrorBoundary inicial.
- Migración: Eliminación de dependencias de localStorage para selección y carrito.
- Historial: Página y hook de órdenes implementados.
- Polling: Estado de pago dinámico en confirmación.

---
## Próximos Pasos Inmediatos
1. Unificar modelo de entradas (tickets) en `cartStore` tras confirmación de asientos (persistir seatCodes + unitPrice).
2. Implementar payload completo de pago (items TICKET/CONCESSION + sessionId) y manejo de respuesta `purchaseNumber`.
3. Endpoint y parsing de detalle completo de compra (mapear a `OrderConfirmation`).
4. Reemplazar stubs y comentarios temporales en servicios por contratos definitivos.

