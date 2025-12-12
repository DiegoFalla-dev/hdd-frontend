# 📚 API Documentation - CinePlus Backend

**Base URL:** `https://hdd-frontend-production.up.railway.app/`  
**Autenticación:** JWT Bearer Token

---

## 🔐 Autenticación

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@cineplus.com",
  "password": "admin123"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "admin@cineplus.com",
  "roles": ["ROLE_ADMIN"]
}
```

### Registro
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "nationalId": "12345678",
  "email": "juan@example.com",
  "password": "password123",
  "birthDate": "1990-05-15"
}
```

---

## 🎬 Películas (Movies)

### Listar todas las películas
```http
GET /api/movies
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "title": "Inception",
    "originalTitle": "Inception",
    "synopsis": "A thief who steals corporate secrets...",
    "duration": 148,
    "releaseDate": "2010-07-16",
    "posterUrl": "https://image.tmdb.org/t/p/w500/...",
    "backdropUrl": "https://image.tmdb.org/t/p/original/...",
    "trailerUrl": "https://www.youtube.com/watch?v=...",
    "rating": "PG-13",
    "language": "English",
    "country": "USA",
    "movieStatus": "NOW_PLAYING",
    "genres": ["Action", "Sci-Fi", "Thriller"],
    "movie_cast": [
      {
        "id": 1,
        "actorName": "Leonardo DiCaprio",
        "characterName": "Dom Cobb",
        "actorImageUrl": "https://..."
      }
    ]
  }
]
```

### Obtener película por ID
```http
GET /api/movies/{id}
```

### Películas por estado
```http
GET /api/movies/status/{status}
```
**Estados:** `NOW_PLAYING`, `PRE_SALE`, `COMING_SOON`

### Buscar películas
```http
GET /api/movies/search?query=inception
```

---

## 🎭 Cines (Cinemas)

### Listar todos los cines
```http
GET /api/cinemas
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "CinePlus Centro",
    "address": "Av. Principal 123",
    "city": "Lima",
    "phone": "+51 999999999",
    "latitude": -12.046374,
    "longitude": -77.042793
  }
]
```

### Obtener cine por ID
```http
GET /api/cinemas/{id}
```

---

## 🎪 Salas (Theaters)

### Listar salas de un cine
```http
GET /api/theaters/cinema/{cinemaId}
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Sala 1",
    "capacity": 120,
    "cinemaId": 1,
    "cinemaName": "CinePlus Centro"
  }
]
```

### Obtener sala por ID
```http
GET /api/theaters/{id}
```

---

## 🎟️ Funciones (Showtimes)

### Listar funciones por cine
```http
GET /api/showtimes?cinema={cinemaId}
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "movieId": 1,
    "movieTitle": "Inception",
    "theaterId": 1,
    "theaterName": "Sala 1",
    "cinemaId": 1,
    "cinemaName": "CinePlus Centro",
    "startTime": "2025-12-09T19:30:00",
    "endTime": "2025-12-09T21:58:00",
    "basePrice": 15.00,
    "availableSeats": 95
  }
]
```

### Funciones por película y cine
```http
GET /api/showtimes/movie/{movieId}/cinema/{cinemaId}
```

### Funciones por película
```http
GET /api/showtimes/movie/{movieId}
```

### Obtener función por ID
```http
GET /api/showtimes/{id}
```

---

## 💺 Asientos (Seats)

### Asientos disponibles por función
```http
GET /api/seats/showtime/{showtimeId}
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "seatNumber": "A1",
    "rowNumber": "A",
    "columnNumber": 1,
    "seatType": "STANDARD",
    "isAvailable": true,
    "theaterId": 1
  }
]
```

### Obtener asiento por ID
```http
GET /api/seats/{id}
```

---

## 🎫 Tipos de Tickets (Ticket Types)

### Listar tipos de tickets
```http
GET /api/ticket-types
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "General",
    "description": "Entrada general"
  },
  {
    "id": 2,
    "name": "Niño",
    "description": "Menores de 12 años"
  },
  {
    "id": 3,
    "name": "Adulto Mayor",
    "description": "Mayores de 65 años"
  }
]
```

---

## 💰 Precios de Tickets (Ticket Prices)

### Obtener precio
```http
GET /api/ticket-prices/showtime/{showtimeId}/type/{ticketTypeId}
```

**Respuesta:**
```json
{
  "id": 1,
  "showtimeId": 1,
  "ticketTypeId": 1,
  "ticketTypeName": "General",
  "price": 15.00
}
```

---

## 🍿 Productos de Concesión (Concession Products)

### Listar productos
```http
GET /api/concession-products
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Popcorn Grande",
    "description": "Palomitas de maíz tamaño grande",
    "price": 8.50,
    "imageUrl": "https://...",
    "category": "SNACKS",
    "available": true
  }
]
```

**Categorías:** `SNACKS`, `BEVERAGES`, `COMBOS`

### Productos por categoría
```http
GET /api/concession-products/category/{category}
```

### Productos disponibles
```http
GET /api/concession-products/available
```

---

## 🛒 Órdenes (Orders)

### Crear orden
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "items": [
    {
      "showtimeId": 1,
      "seatId": 5,
      "ticketTypeId": 1
    },
    {
      "showtimeId": 1,
      "seatId": 6,
      "ticketTypeId": 2
    }
  ],
  "concessions": [
    {
      "concessionProductId": 1,
      "quantity": 2
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": 123,
  "userId": 1,
  "totalAmount": 47.00,
  "status": "PENDING",
  "createdAt": "2025-12-09T15:30:00",
  "items": [
    {
      "id": 1,
      "showtimeId": 1,
      "movieTitle": "Inception",
      "seatNumber": "A5",
      "ticketTypeName": "General",
      "price": 15.00
    }
  ],
  "concessions": [
    {
      "id": 1,
      "productName": "Popcorn Grande",
      "quantity": 2,
      "unitPrice": 8.50,
      "subtotal": 17.00
    }
  ]
}
```

### Obtener orden por ID
```http
GET /api/orders/{id}
Authorization: Bearer {token}
```

### Historial de órdenes del usuario
```http
GET /api/orders/user/{userId}
Authorization: Bearer {token}
```

### Actualizar estado de orden
```http
PUT /api/orders/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

**Estados:** `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`

---

## 💳 Métodos de Pago (Payment Methods)

### Obtener métodos de pago del usuario
```http
GET /api/payment-methods/user/{userId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "cardNumber": "************1234",
    "cardHolderName": "JUAN PEREZ",
    "expirationDate": "12/2026",
    "cardType": "VISA",
    "isDefault": true
  }
]
```

### Agregar método de pago
```http
POST /api/payment-methods
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "cardNumber": "4532123456789012",
  "cardHolderName": "JUAN PEREZ",
  "expirationDate": "12/2026",
  "cvv": "123",
  "cardType": "VISA",
  "isDefault": false
}
```

### Eliminar método de pago
```http
DELETE /api/payment-methods/{id}
Authorization: Bearer {token}
```

---

## 🎉 Promociones (Promotions)

### Listar promociones activas
```http
GET /api/promotions/active
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Martes de Cine",
    "description": "50% de descuento todos los martes",
    "discountType": "PERCENTAGE",
    "discountValue": 50.0,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "imageUrl": "https://..."
  }
]
```

---

## 👥 Gestión de Usuarios (Admin)

### Listar todos los usuarios
```http
GET /api/users
Authorization: Bearer {token}
```
**Permisos:** ADMIN, MANAGER

**Respuesta:**
```json
[
  {
    "id": 1,
    "firstName": "Admin",
    "lastName": "Sistema",
    "nationalId": "00000000",
    "email": "admin@cineplus.com",
    "birthDate": "1990-01-01",
    "avatar": null,
    "roles": ["ROLE_ADMIN"],
    "paymentMethods": []
  }
]
```

### Obtener usuario por ID
```http
GET /api/users/{id}
Authorization: Bearer {token}
```
**Permisos:** ADMIN, MANAGER

### Crear usuario
```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "María",
  "lastName": "González",
  "nationalId": "87654321",
  "email": "maria@example.com",
  "birthDate": "1998-05-20",
  "avatar": null,
  "roles": ["ROLE_USER"]
}
```
**Permisos:** ADMIN  
**Nota:** Contraseña temporal: `TempPass123!`

### Actualizar usuario
```http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "María",
  "lastName": "González",
  "nationalId": "87654321",
  "email": "maria@example.com",
  "birthDate": "1998-05-20",
  "avatar": "https://example.com/avatar.jpg",
  "roles": ["ROLE_USER", "ROLE_MANAGER"]
}
```
**Permisos:** ADMIN, MANAGER

### Eliminar usuario
```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```
**Permisos:** ADMIN

### Contar usuarios
```http
GET /api/users/count
Authorization: Bearer {token}
```
**Permisos:** ADMIN, MANAGER

**Respuesta:**
```json
150
```

### Obtener nombre de usuario (público)
```http
GET /api/users/{id}/name
```

**Respuesta:**
```json
{
  "firstName": "Diego",
  "lastName": "Falla"
}
```

### Historial de compras
```http
GET /api/users/{id}/purchases
Authorization: Bearer {token}
```

---

## 📊 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| `ROLE_USER` | Ver películas, crear órdenes, ver su historial |
| `ROLE_MANAGER` | Permisos de USER + ver usuarios, estadísticas |
| `ROLE_ADMIN` | Control total del sistema |

---

## 🔧 Servicio HTTP (TypeScript/React)

### Configuración de Axios

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Crear instancia de axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Servicios por Módulo

```typescript
// authService.ts
export const authService = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/api/auth/register', userData),
  
  logout: () => {
    localStorage.removeItem('token');
  }
};

// movieService.ts
export const movieService = {
  getAll: () => api.get('/api/movies'),
  getById: (id: number) => api.get(`/api/movies/${id}`),
  getByStatus: (status: string) => api.get(`/api/movies/status/${status}`),
  search: (query: string) => api.get(`/api/movies/search?query=${query}`)
};

// cinemaService.ts
export const cinemaService = {
  getAll: () => api.get('/api/cinemas'),
  getById: (id: number) => api.get(`/api/cinemas/${id}`)
};

// showtimeService.ts
export const showtimeService = {
  getByCinema: (cinemaId: number) => 
    api.get(`/api/showtimes?cinema=${cinemaId}`),
  getByMovie: (movieId: number) => 
    api.get(`/api/showtimes/movie/${movieId}`),
  getByMovieAndCinema: (movieId: number, cinemaId: number) => 
    api.get(`/api/showtimes/movie/${movieId}/cinema/${cinemaId}`),
  getById: (id: number) => api.get(`/api/showtimes/${id}`)
};

// seatService.ts
export const seatService = {
  getByShowtime: (showtimeId: number) => 
    api.get(`/api/seats/showtime/${showtimeId}`)
};

// ticketService.ts
export const ticketService = {
  getTypes: () => api.get('/api/ticket-types'),
  getPrice: (showtimeId: number, ticketTypeId: number) => 
    api.get(`/api/ticket-prices/showtime/${showtimeId}/type/${ticketTypeId}`)
};

// concessionService.ts
export const concessionService = {
  getAll: () => api.get('/api/concession-products'),
  getAvailable: () => api.get('/api/concession-products/available'),
  getByCategory: (category: string) => 
    api.get(`/api/concession-products/category/${category}`)
};

// orderService.ts
export const orderService = {
  create: (orderData: any) => api.post('/api/orders', orderData),
  getById: (id: number) => api.get(`/api/orders/${id}`),
  getByUser: (userId: number) => api.get(`/api/orders/user/${userId}`),
  updateStatus: (id: number, status: string) => 
    api.put(`/api/orders/${id}/status`, { status })
};

// paymentMethodService.ts
export const paymentMethodService = {
  getByUser: (userId: number) => 
    api.get(`/api/payment-methods/user/${userId}`),
  create: (paymentData: any) => 
    api.post('/api/payment-methods', paymentData),
  delete: (id: number) => api.delete(`/api/payment-methods/${id}`)
};

// promotionService.ts
export const promotionService = {
  getActive: () => api.get('/api/promotions/active')
};

// userService.ts (Admin)
export const userService = {
  getAll: () => api.get('/api/users'),
  getById: (id: number) => api.get(`/api/users/${id}`),
  create: (userData: any) => api.post('/api/users', userData),
  update: (id: number, userData: any) => api.put(`/api/users/${id}`, userData),
  delete: (id: number) => api.delete(`/api/users/${id}`),
  count: () => api.get('/api/users/count'),
  getName: (id: number) => api.get(`/api/users/${id}/name`),
  getPurchases: (id: number) => api.get(`/api/users/${id}/purchases`)
};
```

### Hook Personalizado para Autenticación

```typescript
// useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from './services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Decodificar token JWT para obtener datos del usuario
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    setUser(response.data);
    return response.data;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) || false;
  };

  return { user, token, login, logout, hasRole, isAuthenticated: !!token };
};
```

---

## ⚠️ Códigos de Error HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Eliminación exitosa |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error |

---

## 📝 Notas Importantes

1. **CORS:** El backend acepta peticiones desde `http://localhost:5173` y `http://localhost:5174`
2. **Formato de fechas:** ISO 8601 (`YYYY-MM-DDTHH:mm:ss`)
3. **Token JWT:** Expira en 24 horas
4. **Asientos:** Se reservan al crear la orden (no hay reserva temporal)
5. **Concesiones:** Son opcionales en la orden
6. **Métodos de pago:** El CVV no se almacena en la base de datos


---

**Versión:** 1.0  
**Última actualización:** 9 de diciembre de 2025