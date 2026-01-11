/**
 * POST /auth/refresh - Refresh access token
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder, getOrigin } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { refreshAuth } from '../service';
import { config } from '../../../shared/config';

const REFRESH_TOKEN_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://invest-project-web.vercel.app',
];

export const handler: APIGatewayProxyHandler = async (event) => {
  const { successWithCookie, errors } = createResponder(event);
  const origin = getOrigin(event);
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  try {
    // Parse refresh token from cookie
    const cookies = parseCookies(event.headers['Cookie'] || event.headers['cookie'] || '');
    const refreshCookie = cookies['refresh'];

    if (!refreshCookie) {
      return errors.unauthorized('No refresh token');
    }

    // Parse tokenId:token format
    const [tokenId] = refreshCookie.split(':');
    if (!tokenId) {
      return errors.unauthorized('Invalid refresh token format');
    }

    const result = await refreshAuth(tokenId);

    // Build new refresh token cookie if rotated
    if (result.newRefreshToken && result.newRefreshTokenId) {
      const isProduction = config.nodeEnv === 'prod';
      const cookie = buildRefreshCookie(
        result.newRefreshTokenId,
        result.newRefreshToken,
        isProduction
      );
      return successWithCookie({ accessToken: result.accessToken }, cookie);
    }

    return successWithCookie({ accessToken: result.accessToken }, '');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Auth refresh failed', { error: message });

    if (message.includes('revoked') || message.includes('expired') || message.includes('Invalid')) {
      // Clear the cookie on failure
      const clearCookie = 'refresh=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Set-Cookie': clearCookie,
        },
        body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Session expired' } }),
      };
    }

    return errors.internal('Failed to refresh token');
  }
};

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });

  return cookies;
}

function buildRefreshCookie(tokenId: string, token: string, secure: boolean): string {
  const value = `${tokenId}:${token}`;
  const parts = [
    `refresh=${value}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${REFRESH_TOKEN_MAX_AGE}`,
    'SameSite=Lax',
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}
