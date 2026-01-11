import { apiClient } from '@/shared/api';

export interface User {
  id: string;
  email: string;
  locale: string;
}

export interface MeResponse {
  user: User;
}

export const userApi = {
  getMe: () => apiClient.get<MeResponse>('/me'),

  updateLocale: (locale: string) =>
    apiClient.put<{ ok: boolean; locale: string }>('/settings/locale', { locale }),
};
