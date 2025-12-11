export interface User {
  id: number;
  email: string;
  name: string;
  fullName?: string;
  roles: string[];
  active: boolean;
  createdAt?: string;
  fidelityPoints?: number;
  lastPurchaseDate?: string;
}
