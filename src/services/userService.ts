import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://hdd-backend-bedl.onrender.com';

export interface NameDto {
  firstName: string;
  lastName: string;
}

export async function getUserName(id: number | string): Promise<NameDto> {
  const url = `${API_BASE}/api/users/${id}/name`;
  const res = await axios.get(url);
  return res.data as NameDto;
}

export default { getUserName };
