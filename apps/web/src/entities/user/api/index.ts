import { apiClient } from '@/shared/api';

export type InvestmentStyle = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export interface UserConsents {
  privacy: boolean;
  privacyAt: string;
  marketing: boolean;
  marketingAt?: string;
}

export interface UserProfile {
  investmentStyle?: InvestmentStyle;
  expectedMonthlyBudget?: number;
}

export interface User {
  id: string;
  email: string;
  nickname?: string;
  locale: string;
  onboardingCompletedAt: string | null;
  consents?: UserConsents;
  profile?: UserProfile;
}

export interface MeResponse {
  user: User;
}

export interface CompleteOnboardingRequest {
  consents: {
    privacy: boolean;
    marketing: boolean;
  };
  profile?: {
    investmentStyle?: InvestmentStyle;
    expectedMonthlyBudget?: number;
  };
}

export interface CompleteOnboardingResponse {
  ok: boolean;
  user: User;
}

export const userApi = {
  getMe: () => apiClient.get<MeResponse>('/me'),

  updateLocale: (locale: string) =>
    apiClient.put<{ ok: boolean; locale: string }>('/settings/locale', { locale }),

  completeOnboarding: (request: CompleteOnboardingRequest) =>
    apiClient.put<CompleteOnboardingResponse>('/onboarding/complete', request),

  logout: async () => {
    try {
      await apiClient.post<{ ok: boolean }>('/auth/logout');
    } finally {
      // Always clear local state even if API fails
      apiClient.setAccessToken(null);
    }
  },
};
