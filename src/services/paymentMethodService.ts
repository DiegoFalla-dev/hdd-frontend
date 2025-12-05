import api from './apiClient';
import authService from './authService';
import type { PaymentMethod, CreatePaymentMethodRequest } from '../types/PaymentMethod';

// Obtener el userId del usuario autenticado
function getUserId(): number | string {
  const user = authService.getCurrentUser();
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }
  return user.id;
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const userId = getUserId();
  const res = await api.get<PaymentMethod[]>(`/users/${userId}/payment-methods`);
  return res.data;
}

export async function createPaymentMethod(payload: CreatePaymentMethodRequest): Promise<PaymentMethod> {
  const userId = getUserId();
  const res = await api.post<PaymentMethod>(`/users/${userId}/payment-methods`, payload);
  return res.data;
}

export async function deletePaymentMethod(id: number): Promise<void> {
  const userId = getUserId();
  await api.delete(`/users/${userId}/payment-methods/${id}`);
}

export async function setDefaultPaymentMethod(id: number): Promise<PaymentMethod> {
  const userId = getUserId();
  const res = await api.patch<PaymentMethod>(`/users/${userId}/payment-methods/${id}/default`, {});
  return res.data;
}

export async function updatePaymentMethod(id: number, payload: CreatePaymentMethodRequest): Promise<PaymentMethod> {
  const userId = getUserId();
  const res = await api.put<PaymentMethod>(`/users/${userId}/payment-methods/${id}`, payload);
  return res.data;
}

export default { listPaymentMethods, createPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod, updatePaymentMethod };