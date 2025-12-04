import { useQuery } from '@tanstack/react-query';
import api from '../services/apiClient';

export interface TicketType {
  id: number;
  code: string;
  name: string;
  price: number;
  active: boolean;
}

export function useTicketTypes() {
  return useQuery({
    queryKey: ['ticketTypes'],
    queryFn: async () => {
      const response = await api.get<TicketType[]>('/ticket-types');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
