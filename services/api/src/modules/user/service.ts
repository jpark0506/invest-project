/**
 * User service
 */

import * as userRepo from './repo';
import type { MeResponse } from './types';

/**
 * Get current user info
 */
export async function getMe(userId: string): Promise<MeResponse> {
  const user = await userRepo.getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  return {
    user: {
      id: user.userId,
      email: user.email,
      locale: user.locale,
    },
  };
}

/**
 * Update user locale
 */
export async function updateLocale(userId: string, locale: string): Promise<void> {
  // Validate locale
  const validLocales = ['ko-KR', 'en-US'];
  if (!validLocales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  await userRepo.updateUserLocale(userId, locale);
}
