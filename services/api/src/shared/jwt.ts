/**
 * JWT utility functions
 */

import * as jose from 'jose';
import { config } from './config';
import { getSecret } from './secrets';

export interface JwtPayload {
  sub: string; // userId
  email?: string;
}

let jwtSecretKey: Uint8Array | null = null;

/**
 * Get the JWT secret key (cached)
 */
async function getJwtSecret(): Promise<Uint8Array> {
  if (jwtSecretKey) {
    return jwtSecretKey;
  }

  // In development, use a hardcoded secret
  if (config.nodeEnv === 'dev' && !config.jwtSecretArn) {
    jwtSecretKey = new TextEncoder().encode('dev-secret-key-do-not-use-in-production');
    return jwtSecretKey;
  }

  const secret = await getSecret(config.jwtSecretArn);
  jwtSecretKey = new TextEncoder().encode(secret);
  return jwtSecretKey;
}

/**
 * Generate an access token
 */
export async function generateAccessToken(payload: JwtPayload): Promise<string> {
  const secret = await getJwtSecret();

  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.jwtAccessExpiry)
    .setIssuer('invest-assist')
    .sign(secret);
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const secret = await getJwtSecret();

  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: 'invest-assist',
  });

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
  };
}
