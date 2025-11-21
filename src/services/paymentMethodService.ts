import api from './apiClient';
import type { PaymentMethod, CreatePaymentMethodRequest } from '../types/PaymentMethod';

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await api.get<PaymentMethod[]>('/payment-methods');
  return res.data;
}

export async function createPaymentMethod(payload: CreatePaymentMethodRequest): Promise<PaymentMethod> {
  const res = await api.post<PaymentMethod>('/payment-methods', payload);
  return res.data;
}

export async function deletePaymentMethod(id: number): Promise<void> {
  await api.delete(`/payment-methods/${id}`);
}

export async function setDefaultPaymentMethod(id: number): Promise<PaymentMethod> {
  const res = await api.post<PaymentMethod>(`/payment-methods/${id}/default`, {});
  return res.data;
}

export default { listPaymentMethods, createPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod };