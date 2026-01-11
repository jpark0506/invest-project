/**
 * API Gateway response utilities
 */

import type { APIGatewayProxyResult } from 'aws-lambda';
import { config } from './config';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': config.appUrl,
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

/**
 * Create a successful JSON response
 */
export function success<T>(body: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

/**
 * Create a successful response with Set-Cookie header
 */
export function successWithCookie<T>(
  body: T,
  cookie: string,
  statusCode = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
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
  details?: Record<string, unknown>
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
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

/**
 * Common error responses
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
