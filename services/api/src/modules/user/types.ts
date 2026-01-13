/**
 * User module types
 */

export type InvestmentStyle = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export interface UserConsents {
  privacy: boolean;
  privacyAt: string; // ISO
  marketing: boolean;
  marketingAt?: string; // ISO, optional
}

export interface UserProfile {
  investmentStyle?: InvestmentStyle;
  expectedMonthlyBudget?: number;
}

export type AuthProvider = 'email' | 'kakao';

export interface User {
  userId: string;
  email: string;
  locale: string;
  provider?: AuthProvider;
  providerId?: string; // External provider user ID (e.g., Kakao ID)
  onboardingCompletedAt: string | null; // ISO or null
  consents?: UserConsents;
  profile?: UserProfile;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    locale: string;
    onboardingCompletedAt: string | null;
    consents?: UserConsents;
    profile?: UserProfile;
  };
}

export interface UpdateLocaleRequest {
  locale: string;
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
