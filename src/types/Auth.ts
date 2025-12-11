export interface JwtResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: 'Bearer';
  expiresIn?: number; // segundos
  roles?: string[];
  id?: number;
  email?: string;
  fullName?: string;
  fidelityPoints?: number;
  lastPurchaseDate?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
