/**
 * POST /auth/verify - Verify magic link token and create session
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { verifyAuth } from '../service';
import { config } from '../../../shared/config';

interface VerifyAuthBody {
  token?: string;
}

const REFRESH_TOKEN_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

export const handler: APIGatewayProxyHandler = async (event) => {
  const { successWithCookie, errors } = createResponder(event);

  try {
    const body: VerifyAuthBody = event.body ? JSON.parse(event.body) : {};

    if (!body.token) {
      return errors.validation('Token is required');
    }

    const { response, refreshToken, refreshTokenId } = await verifyAuth(body.token);

    // Build refresh token cookie
    const isProduction = config.nodeEnv === 'prod';
    const cookie = buildRefreshCookie(refreshTokenId, refreshToken, isProduction);

    return successWithCookie(response, cookie);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Auth verify failed', { error: message });

    if (message.includes('expired') || message.includes('Invalid')) {
      return errors.unauthorized('Invalid or expired token');
    }

    return errors.internal('Failed to verify token');
  }
};

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
