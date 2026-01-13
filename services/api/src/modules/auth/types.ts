/**
 * Auth module types
 */

import type { UserConsents, UserProfile } from '../user/types';

export interface AuthToken {
  tokenHash: string;
  email: string;
  expiresAt: number; // Unix timestamp for TTL
  createdAt: string; // ISO
}

export interface RefreshToken {
  tokenId: string;
  userId: string;
  tokenHash: string;
  expiresAt: number; // Unix timestamp for TTL
  createdAt: string; // ISO
  revokedAt?: string | null; // ISO, if revoked
}

export interface StartAuthRequest {
  email: string;
}

export interface VerifyAuthRequest {
  token: string;
}

export interface VerifyAuthResponse {
  user: {
    id: string;
    email: string;
    nickname?: string;
    locale: string;
    onboardingCompletedAt: string | null;
    consents?: UserConsents;
    profile?: UserProfile;
  };
  accessToken: string;
}

export interface RefreshAuthResponse {
  accessToken: string;
}
