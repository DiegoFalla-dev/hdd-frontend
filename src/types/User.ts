export interface User {
  id: number;
  email: string;
  name: string;
  roles: string[];
  active: boolean;
  createdAt?: string;
}
