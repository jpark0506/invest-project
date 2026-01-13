import { apiClient } from '@/shared/api';
import type { User } from '@/entities/user/api';

export interface StartAuthResponse {
  ok: boolean;
}

export interface VerifyAuthResponse {
  user: User;
  accessToken: string;
}

export const authApi = {
  start: (email: string) =>
    apiClient.post<StartAuthResponse>('/auth/start', { email }),

  verify: (token: string) =>
    apiClient.post<VerifyAuthResponse>('/auth/verify', { token }),

  refresh: () =>
    apiClient.post<{ accessToken: string }>('/auth/refresh'),

  logout: () =>
    apiClient.post<{ ok: boolean }>('/auth/logout'),
};
