// ===== CINEPLUS BACKEND API INTEGRATION =====
// Base URL Configuration
export const API_BASE_URL = 'http://localhost:8080/api';

// ===== AUTHENTICATION ENDPOINTS =====
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register'
} as const;

// ===== PUBLIC ENDPOINTS (No Auth Required) =====
export const PUBLIC_ENDPOINTS = {
  // Movies
  MOVIES: '/movies',
  MOVIE_BY_ID: (id: number) => `/movies/${id}`,
  
  // Cinemas
  CINEMAS: '/cinemas',
  CINEMA_BY_ID: (id: number) => `/cinemas/${id}`,
  
  // Theaters
  THEATERS: '/theaters',
  THEATERS_BY_CINEMA: (cinemaId: number) => `/theaters?cinemaId=${cinemaId}`,
  
  // Showtimes
  SHOWTIMES: (cinemaId: number, movieId: number) => `/showtimes?cinema=${cinemaId}&movie=${movieId}`,
  SHOWTIME_DETAILS: (id: number, cinemaId: number) => `/showtimes/${id}?cinema=${cinemaId}`,
  OCCUPIED_SEATS: (showtimeId: number) => `/showtimes/${showtimeId}/seats/occupied`,
  
  // Concessions
  CONCESSIONS: (cinemaId: number) => `/concessions?cinema=${cinemaId}`,
  CONCESSIONS_BY_CATEGORY: (cinemaId: number, category: string) => `/concessions?cinema=${cinemaId}&category=${category}`,
  
  // User Name (Public)
  USER_NAME: (userId: number) => `/users/${userId}/name`
} as const;

// ===== PROTECTED ENDPOINTS (Auth Required) =====
export const PROTECTED_ENDPOINTS = {
  // Orders
  CREATE_ORDER: '/orders',
  USER_ORDERS: (userId: number) => `/orders/user/${userId}`,
  ORDER_BY_ID: (id: number) => `/orders/${id}`,
  ORDER_ITEMS: (orderId: number) => `/orders/${orderId}/items`,
  
  // Payment Methods
  PAYMENT_METHODS: (userId: number) => `/users/${userId}/payment-methods`,
  
  // Promotions
  PROMOTION_BY_CODE: (code: string) => `/promotions/code/${code}`,
  
  // Seat Management
  RESERVE_SEATS: (showtimeId: number) => `/showtimes/${showtimeId}/seats/reserve`,
  RELEASE_SEATS: (showtimeId: number) => `/showtimes/${showtimeId}/seats/release`,
  CONFIRM_SEATS: (showtimeId: number) => `/showtimes/${showtimeId}/seats/confirm`,
  
  // File Downloads
  INVOICE_PDF: (orderId: number) => `/orders/${orderId}/invoice-pdf`,
  TICKET_QR: (itemId: number) => `/orders/items/${itemId}/qr-code`,
  TICKET_PDF: (itemId: number) => `/orders/items/${itemId}/ticket-pdf`
} as const;

// ===== TYPE DEFINITIONS =====

// Auth Types
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  nationalId?: string;
  email: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
  roles?: string[];
}

export interface JwtResponse {
  token: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
  type: string;
}

// Movie Types
export interface Movie {
  id: number;
  title: string;
  synopsis: string;
  genre: string;
  classification: string;
  duration: string;
  cardImageUrl: string;
  bannerUrl: string;
  trailerUrl: string;
  cast: string[];
  showtimes: string[];
  status: 'CARTELERA' | 'PREVENTA' | 'PROXIMO';
}

// Cinema Types
export interface Cinema {
  id: number;
  name: string;
  city: string;
  address: string;
  location: string;
  availableFormats: string[];
  image: string;
}

// Theater Types
export interface Theater {
  id: number;
  cinemaId: number;
  cinemaName: string;
  name: string;
  seatMatrixType: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
  rowCount: number;
  colCount: number;
  totalSeats: number;
}

// Showtime Types
export interface Showtime {
  id: number;
  movieId: number;
  movieTitle: string;
  theaterId: number;
  theaterName: string;
  cinemaId: number;
  cinemaName: string;
  date: string; // ISO date
  time: string; // HH:mm format
  format: '_2D' | '_3D' | 'XD';
  availableSeats: number;
  totalSeats: number;
  seatMatrixType: string;
}

// Seat Types
export interface Seat {
  id: number;
  seatNumber: string;
  isAvailable: boolean;
  theaterId: number;
  theaterName: string;
  seatRow: string;
  seatColumn: number;
}

// Order Types
export interface CreateOrderRequest {
  userId: number;
  paymentMethodId: number;
  items: CreateOrderItem[];
  promotionCode?: string;
}

export interface CreateOrderItem {
  showtimeId: number;
  seatId: number;
  price: number;
}

export interface Order {
  id: number;
  user: User;
  orderDate: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  orderStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  invoiceNumber: string;
  invoicePdfUrl: string;
  qrCodeUrl: string;
  orderItems: OrderItem[];
  promotion?: Promotion;
}

export interface OrderItem {
  id: number;
  orderId: number;
  showtime: Showtime;
  seat: Seat;
  price: number;
  ticketStatus: 'VALID' | 'USED' | 'CANCELLED';
  qrCodeTicketUrl: string;
  ticketPdfUrl: string;
}

// User Types
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  birthDate: string;
  avatar: string;
  roles: string[];
  paymentMethods: PaymentMethod[];
}

export interface UserName {
  firstName: string;
  lastName: string;
}

// Payment Method Types
export interface PaymentMethod {
  id: number;
  isDefault: boolean;
  maskedCardNumber: string;
}

export interface CreatePaymentMethod {
  cardNumber: string;
  cardHolder: string;
  cci: string;
  expiry: string;
  phone: string;
  isDefault: boolean;
}

// Promotion Types
export interface Promotion {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startDate: string;
  endDate: string;
  minAmount: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

// Concession Types
export interface ConcessionProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'COMBOS' | 'CANCHITA' | 'BEBIDAS' | 'SNACKS';
  cinemaId: number[];
}

// ===== API CLIENT CONFIGURATION =====
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
};

// Auth Header Helper
export const getAuthHeaders = (token: string) => ({
  ...API_CONFIG.headers,
  'Authorization': `Bearer ${token}`
});

// ===== HTTP METHODS MAPPING =====
export const HTTP_METHODS = {
  // Auth
  LOGIN: 'POST',
  REGISTER: 'POST',
  
  // Movies (Public)
  GET_MOVIES: 'GET',
  GET_MOVIE: 'GET',
  
  // Cinemas (Public)
  GET_CINEMAS: 'GET',
  GET_CINEMA: 'GET',
  
  // Theaters (Public)
  GET_THEATERS: 'GET',
  
  // Showtimes (Public)
  GET_SHOWTIMES: 'GET',
  GET_SHOWTIME_DETAILS: 'GET',
  GET_OCCUPIED_SEATS: 'GET',
  
  // Concessions (Public)
  GET_CONCESSIONS: 'GET',
  
  // Orders (Protected)
  CREATE_ORDER: 'POST',
  GET_USER_ORDERS: 'GET',
  GET_ORDER: 'GET',
  
  // Payment Methods (Protected)
  GET_PAYMENT_METHODS: 'GET',
  CREATE_PAYMENT_METHOD: 'POST',
  
  // Seat Management (Protected)
  RESERVE_SEATS: 'POST',
  RELEASE_SEATS: 'POST',
  CONFIRM_SEATS: 'POST',
  
  // Promotions (Protected)
  GET_PROMOTION: 'GET'
} as const;

// ===== EXAMPLE USAGE =====
/*
// 1. Authentication
const loginData: LoginRequest = {
  usernameOrEmail: "user@example.com",
  password: "password123"
};

// 2. Fetch Movies
const moviesUrl = `${API_BASE_URL}${PUBLIC_ENDPOINTS.MOVIES}`;

// 3. Get Showtimes
const showtimesUrl = `${API_BASE_URL}${PUBLIC_ENDPOINTS.SHOWTIMES(1, 1)}`;

// 4. Create Order (with auth)
const orderData: CreateOrderRequest = {
  userId: 1,
  paymentMethodId: 1,
  items: [
    {
      showtimeId: 1,
      seatId: 1,
      price: 15.00
    }
  ],
  promotionCode: "DESCUENTO10"
};

// 5. Reserve Seats
const seatReservation = {
  seatIdentifiers: ["A1", "A2"]
};
*/

// ===== CORS CONFIGURATION =====
export const CORS_CONFIG = {
  allowedOrigins: ['http://localhost:5173', 'http://localhost:5174'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  allowCredentials: true
};

// ===== ERROR HANDLING TYPES =====
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

// ===== RESPONSE WRAPPERS =====
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ===== PAGINATION (if needed) =====
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ===== FRONTEND INTEGRATION NOTES =====
/*
SETUP INSTRUCTIONS:

1. Install Dependencies:
   npm install axios react-router-dom @types/react @types/react-dom

2. Environment Variables (.env):
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_APP_NAME=CinePlus

3. Axios Configuration (api.ts):
   import axios from 'axios';
   
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_BASE_URL,
     withCredentials: true
   });

4. Auth Context Setup:
   - Store JWT token in localStorage
   - Add token to axios interceptors
   - Handle token expiration

5. Key Features to Implement:
   - Movie catalog with filters
   - Cinema and showtime selection
   - Seat selection interface
   - Shopping cart for tickets
   - Payment method management
   - Order history
   - Ticket QR codes
   - Responsive design with Tailwind

6. Security Considerations:
   - Validate all user inputs
   - Handle authentication states
   - Secure file downloads
   - CORS configuration matches backend
*/