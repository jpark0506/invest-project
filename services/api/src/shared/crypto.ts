/**
 * Cryptographic utilities
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random token
 * @param length Number of bytes (default 32)
 * @returns Hex-encoded random string
 */
export function generateToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash a token using SHA-256
 * @param token The token to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
