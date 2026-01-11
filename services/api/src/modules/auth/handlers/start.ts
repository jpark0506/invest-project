/**
 * POST /auth/start - Send magic link email
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { startAuth } from '../service';

interface StartAuthBody {
  email?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    const body: StartAuthBody = event.body ? JSON.parse(event.body) : {};

    if (!body.email) {
      return errors.validation('Email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errors.validation('Invalid email format');
    }

    await startAuth(body.email);

    return success({ ok: true });
  } catch (error) {
    logger.error('Auth start failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errors.internal('Failed to send login email');
  }
};
