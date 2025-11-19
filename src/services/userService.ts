import apiClient from './apiClient';

export interface NameDto {
  firstName: string;
  lastName: string;
}

export async function getUserName(id: number | string): Promise<NameDto> {
  const url = `/api/users/${id}/name`;
  const res = await apiClient.get(url);
  return res.data as NameDto;
}

export default { getUserName };
