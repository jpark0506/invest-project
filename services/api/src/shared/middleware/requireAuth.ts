/**
 * Authentication middleware for Lambda handlers
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { verifyAccessToken, JwtPayload } from '../jwt';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  auth: JwtPayload;
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Extract and verify the access token from the Authorization header
 * @returns The decoded JWT payload
 * @throws UnauthorizedError if token is missing or invalid
 */
export async function requireAuth(event: APIGatewayProxyEvent): Promise<JwtPayload> {
  const authHeader = event.headers['Authorization'] || event.headers['authorization'];

  if (!authHeader) {
    throw new UnauthorizedError('Missing Authorization header');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Invalid Authorization header format');
  }

  try {
    return await verifyAccessToken(token);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
