# Fase 1

Objetivo: Eliminar datos estáticos del frontend, centralizar configuración API y establecer tipado base y cliente HTTP robusto para soportar futuras fases (autenticación, carrito, butacas, promociones).

## Cambios Principales

1. Tipos creados (`src/types/*`): Movie, User, Showtime, Seat, Theater, Promotion (con Request/Response de validación), Order (preview/create), PaymentMethod, Auth (JwtResponse/Login/Register), Paginated.
2. Configuración de entorno centralizada (`src/config/env.ts`) con normalización de `VITE_API_BASE_URL` y sufijo `/api` automático.
3. Cliente HTTP mejorado (`src/services/apiClient.ts`):
   - Interceptor de Authorization con access token.
   - Refresh automático en 401 usando `/auth/refresh`.
   - Timeout y cancelación de solicitudes duplicadas.
4. Almacenamiento seguro de tokens (`src/utils/storage.ts`) con helpers `setAuthTokens`, `getAccessToken`, `getRefreshToken`, `clearAuthTokens`.
5. Eliminación de datos estáticos:
   - HeroBanner: se reemplaza arreglo fijo de banners por películas destacadas (`fetchAllMovies()` filtrando estado `NOW_PLAYING`).
   - MovieCarousel: se eliminan categorías hard-coded y slicing; ahora filtra por estados reales (`NOW_PLAYING`, `PRESALE`, `UPCOMING`).
   - Cartelera: elimina segmentación por índices y usa filtro por estado; mapeo adaptador hacia `MovieCard` conservando estilos.
   - Dulcería: categorías derivadas dinámicamente de `productos` cargados; íconos permanecen como constantes de presentación (no dominio).
   - DetallePelicula: remueve formatos y horarios fijos; placeholders sustituidos por datos de película y (futuro) showtimes dinámicos. Formatos ahora se alimentarán de `movie.formats` (cuando backend lo exponga) y horarios mediante `showtimeService`.
   - moviesService: se elimina `FALLBACK_MOVIES`; no más datos falsos. Sólo respuesta backend; tipado unificado y paginación.
6. Servicios refactorizados (cinemas, concessions, auth) para usar `apiClient` y rutas relativas (`/cinemas`, `/concessions`, `/auth/*`).
7. Nuevo `showtimeService.ts` para futura integración de horarios reales (estructura DTO preparada).

## Archivos Modificados / Añadidos

- Añadidos: `.env.example`, `src/config/env.ts`, todos los archivos en `src/types` nuevos, `docs/fases/Fase1.md`, `src/services/showtimeService.ts`.
- Modificados: `moviesService.ts`, `HeroBanner.tsx`, `MovieCarousel.tsx`, `Cartelera.tsx`, `Dulceria.tsx`, `DetallePelicula.tsx`, `cinemaService.ts`, `concessionService.ts`, `authService.ts`, `storage.ts`, `apiClient.ts`.

## Consideraciones Pendientes

- `DetallePelicula` aún muestra horarios simulados mientras se conectan endpoints reales de showtimes (requiere backend final de `/showtimes`).
- `MovieCard` continúa usando interfaz antigua internamente; en Fase 2/3 conviene alinear completamente con nuevo tipo `Movie` o crear adaptador.
- Íconos de categorías dulcería permanecen como constantes de UI (no dominio). Si backend provee metadata de categoría, se puede enlazar directamente.
- Falta hook/context de Auth (inicio Fase 2) para proveer sesión reactiva sin depender de eventos globales.

## Resultados

El frontend ya no depende de colecciones estáticas de películas, banners ni productos. Toda la data proviene de servicios hacia backend; se establecieron cimientos para cacheo y revalidación futura (React Query en Fase 3). Seguridad y refresh de token básicos listos para integrarse en flujo de autenticación.

## Próximos Pasos (Fase 2)

1. Implementar flujo Login/Register usando `authService` refactorizado y almacenamiento seguro.
2. Crear `AuthContext` o store Zustand para estado global de usuario y tokens.
3. Botón/Panel de perfil: mostrar datos reales, acción logout, refresh transparente.
4. Protección de rutas sensibles (carritos, confirmación, perfil) mediante guard/HOC/hook.

---
Fase 1 completada.