/**
 * API Gateway response utilities
 */

import type { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { config } from './config';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://invest-project-web.vercel.app',
];

// Add APP_URL from config if not already in list
if (config.appUrl && !ALLOWED_ORIGINS.includes(config.appUrl)) {
  ALLOWED_ORIGINS.push(config.appUrl);
}

/**
 * Get CORS headers with dynamic origin validation
 */
function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
}

/**
 * Extract origin from API Gateway event
 */
export function getOrigin(event: APIGatewayProxyEvent): string | undefined {
  return event.headers.origin || event.headers.Origin;
}

/**
 * Create a successful JSON response
 */
export function success<T>(body: T, statusCode = 200, origin?: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body),
  };
}

/**
 * Create a successful response with Set-Cookie header
 */
export function successWithCookie<T>(
  body: T,
  cookie: string,
  statusCode = 200,
  origin?: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      ...getCorsHeaders(origin),
      'Set-Cookie': cookie,
    },
    body: JSON.stringify(body),
  };
}

/**
 * Create an error response
 */
export function error(
  code: string,
  message: string,
  statusCode = 400,
  details?: Record<string, unknown>,
  origin?: string
): APIGatewayProxyResult {
  const body: ErrorBody = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body),
  };
}

/**
 * Create response factory with pre-bound origin
 */
export function createResponder(event: APIGatewayProxyEvent) {
  const origin = getOrigin(event);

  return {
    success: <T>(body: T, statusCode = 200) => success(body, statusCode, origin),
    successWithCookie: <T>(body: T, cookie: string, statusCode = 200) =>
      successWithCookie(body, cookie, statusCode, origin),
    error: (code: string, message: string, statusCode = 400, details?: Record<string, unknown>) =>
      error(code, message, statusCode, details, origin),
    errors: {
      unauthorized: (message = 'Unauthorized') => error('UNAUTHORIZED', message, 401, undefined, origin),
      forbidden: (message = 'Forbidden') => error('FORBIDDEN', message, 403, undefined, origin),
      notFound: (message = 'Not found') => error('NOT_FOUND', message, 404, undefined, origin),
      conflict: (message: string) => error('CONFLICT', message, 409, undefined, origin),
      validation: (message: string, details?: Record<string, unknown>) =>
        error('VALIDATION_ERROR', message, 400, details, origin),
      internal: (message = 'Internal server error') => error('INTERNAL_ERROR', message, 500, undefined, origin),
    },
  };
}

/**
 * Common error responses (for backwards compatibility)
 */
export const errors = {
  unauthorized: (message = 'Unauthorized') =>
    error('UNAUTHORIZED', message, 401),

  forbidden: (message = 'Forbidden') =>
    error('FORBIDDEN', message, 403),

  notFound: (message = 'Not found') =>
    error('NOT_FOUND', message, 404),

  conflict: (message: string) =>
    error('CONFLICT', message, 409),

  validation: (message: string, details?: Record<string, unknown>) =>
    error('VALIDATION_ERROR', message, 400, details),

  internal: (message = 'Internal server error') =>
    error('INTERNAL_ERROR', message, 500),
};
