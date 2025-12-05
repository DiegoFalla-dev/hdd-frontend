# Fase 2

Objetivo: Implementar autenticación completa (login, registro, logout) y protección de rutas usando contexto de sesión y wrapper de autorización.

## Cambios Realizados

1. Contexto de Autenticación (`src/context/AuthContext.tsx`):
   - Estado `user`, bandera `loading`, métodos `login`, `register`, `logout`, `refresh`.
   - Derivado `isAuthenticated` comprobando usuario + access token.
   - Uso de `authService` existente adaptado al nuevo almacenamiento de tokens (helpers en `storage`).
2. Almacenamiento de Tokens: Reutiliza helpers creados en Fase 1 para access/refresh. Logout limpia ambos.
3. Rutas Protegidas:
   - Componente `ProtectedRoute` evalúa autenticación y roles. Redirige a `/login` preservando `from`.
   - Se envolvieron rutas sensibles: confirmación, carritos, butacas y pago.
4. Páginas de Autenticación:
   - `Login.tsx`: formulario controlado, manejo de errores simples, redirect post-login a ruta original.
   - `Register.tsx`: validación de coincidencia de contraseñas, redirect a login tras registro.
5. Inyección Global:
   - `main.tsx` ahora envuelve toda la app con `<AuthProvider>`.
6. Actualización de Rutas (`App.tsx`): Añadidas rutas `login` y `register`; rutas críticas envueltas con `ProtectedRoute`.

## Archivos Afectados

- Añadidos: `AuthContext.tsx`, `ProtectedRoute.tsx`, `Login.tsx`, `Register.tsx`, `Fase2.md`.
- Modificados: `main.tsx`, `App.tsx`.

## Consideraciones / Pendientes

- `authService` aún espera `usernameOrEmail`; podría alinearse a un DTO uniforme (`LoginRequest`) posterior.
- Refresh manual no implementado (interceptor maneja 401). Para rotación avanzada de tokens se requerirá endpoint dedicado y lista negra en backend.
- Perfil y edición de datos de usuario se implementarán en Fase 5.
- Falta capa de feedback (toasts) para errores detallados; se cubrirá en Fase 6 (estandarización respuestas).
- Roles: actualmente validación básica; si backend retorna jerarquías/permisos se podrá extender a claims contextuales.

## Resultado

La aplicación evita acceso no autenticado a rutas clave y permite flujo de registro + inicio de sesión con tokens persistidos y refresh automático. Base lista para integrar estado global (React Query / Zustand) en Fase 3.

## Próximos Pasos (Fase 3)

1. Integrar React Query para caching de películas, cines, productos, showtimes.
2. Store global para carrito y selección de butacas.
3. Normalizar modelos para cálculo de totales y aplicación de promociones.
4. Prefetch de datos críticos post-login.

---
Fase 2 completada.