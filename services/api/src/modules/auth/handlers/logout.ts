/**
 * POST /auth/logout - Revoke refresh token and clear cookie
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { logger } from '../../../shared/logger';
import { logout } from '../service';
import { getOrigin } from '../../../shared/response';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://invest-project-web.vercel.app',
];

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = getOrigin(event);
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  try {
    // Parse refresh token from cookie
    const cookies = parseCookies(event.headers['Cookie'] || event.headers['cookie'] || '');
    const refreshCookie = cookies['refresh'];

    if (refreshCookie) {
      const [tokenId] = refreshCookie.split(':');
      if (tokenId) {
        await logout(tokenId);
      }
    }

    // Clear the cookie
    const clearCookie = 'refresh=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Set-Cookie': clearCookie,
      },
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    logger.error('Auth logout failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Still clear the cookie even on error
    const clearCookie = 'refresh=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Set-Cookie': clearCookie,
      },
      body: JSON.stringify({ ok: true }),
    };
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
