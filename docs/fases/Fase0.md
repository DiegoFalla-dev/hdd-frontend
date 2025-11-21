# Fase 0 – Análisis y Extensión Inicial de Endpoints

## Objetivo
Realizar un inventario de los endpoints existentes en el backend, detectar brechas funcionales para los flujos del frontend (cartelera, autenticación, orden de compra, promociones, métodos de pago) y aplicar extensiones mínimas que faciliten las siguientes fases sin romper compatibilidad.

## Endpoints Originales Inventariados
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

## Brechas Detectadas
1. Falta paginación / filtros avanzados en películas y concesiones.
2. No existe refresh token para sesiones prolongadas.
3. Orden: falta preview antes de crear y cancelación del flujo.
4. Promociones: falta endpoint para validar y calcular total rápido.
5. Métodos de pago: falta eliminación y definición de método por defecto.
6. Ausencia de endpoints de estado específicos (now-playing, upcoming, presale) simplificados.

## Cambios Aplicados en Fase 0
### Películas
- Añadidos filtros y paginación: parámetros `status`, `genre`, `q`, `page`, `size` en `GET /api/movies`.
- Nuevos endpoints por estado:
  - `/api/movies/now-playing` (status CARTELERA)
  - `/api/movies/upcoming` (status PROXIMO)
  - `/api/movies/presale` (status PREVENTA)
- Repository extendido con métodos para combinaciones de status/genre/title.
- Service: método `searchMovies` y `findByStatus`.

### Auth
- Endpoint de refresh: `POST /api/auth/refresh` con emisión de nuevo JWT a partir del token recibido.
- `JwtUtils` ampliado con `generateTokenFromUsername`.
- Nota: implementación básica (no almacena refresh tokens persistidos); se reforzará si se requiere revocación.

### Órdenes
- Endpoint preview: `POST /api/orders/preview` calcula total y promoción sin persistencia ni reserva de asientos.
- Endpoint cancelación: `PATCH /api/orders/{id}/cancel` transición a estado CANCELLED cuando proceda.
- `OrderService` extendido con `previewOrder` y `cancelOrder`.
- `OrderDTO` incorpora campo auxiliar `promotionCode` para respuestas de preview.

### Promociones
- Endpoint validación: `POST /api/promotions/validate?code=...&baseAmount=...` devuelve total con descuento aplicado.
- Service: método `calculateDiscountedTotal`.

### Métodos de Pago
- `DELETE /api/users/{userId}/payment-methods/{paymentMethodId}` para eliminación.
- `PATCH /api/users/{userId}/payment-methods/{paymentMethodId}/default` para marcar método por defecto (limpia anteriores).
- Service ampliado con `deletePaymentMethod` y `setDefault`.

## Impacto en Frontend (Preparación Fase 1)
- Servicios de películas podrán usar paginación y filtros evitando sobrecarga.
- Motor de autenticación podrá implementar renovación de token sin re-login inmediato.
- Flujo de checkout podrá ofrecer vista previa antes de reservar/confirmar.
- Cálculo de promociones desacoplado del cliente (reduce duplicación de reglas).
- Gestión de métodos de pago más completa (UX perfil).

## Riesgos y Consideraciones
- Refresh token inseguro si se usa el mismo formato sin rotación ni lista de revocación.
- La lógica de preview no valida disponibilidad dinámica de asientos (solo suma precios); se añadirá en Fase 4 si se requiere estricta verificación previa.
- Paginación actual no añade metadatos de total páginas en responses de listas sin filtros (cuando se usa lista simple). El frontend debe detectar si recibió Page o List.

## Próximos Pasos (Fase 1)
1. Definir tipos TypeScript para todos los DTO + nuevas estructuras (MovieSearchResponse Page wrapper, PromotionValidateResult, OrderPreview).
2. Introducir `.env` con `VITE_API_BASE_URL` para apuntar a `/api`.
3. Ajustar `apiClient` para manejar refresh en 401 expirado.
4. Documentar en README cómo consumir nuevos endpoints.

## Diff Resumido (Conceptual)
- Modificados: `MovieRepository`, `MovieService`, `MovieServiceImpl`, `MovieController`, `AuthService`, `AuthServiceImpl`, `JwtUtils`, `AuthController`, `OrderService`, `OrderServiceImpl`, `OrderController`, `PromotionService`, `PromotionServiceImpl`, `PromotionController`, `PaymentMethodService`, `PaymentMethodServiceImpl`, `PaymentMethodController`, `OrderDTO`.
- Añadidos métodos de negocio: filtrado avanzado, refresh token, preview/cancel orden, validar promoción, gestión default/eliminar método de pago.

## Validación Pendiente
- Probar manualmente nuevos endpoints (Postman/cURL) antes de integrar en frontend.
- Confirmar que estados adicionales (CANCELLED) estén manejados en frontend cuando se implemente.

---
_Archivo generado automáticamente en Fase 0. Las fases siguientes extenderán esta carpeta con Fase1.md, Fase2.md, etc._
