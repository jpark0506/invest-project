/**
 * GET /me - Get current user info
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { success, errors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { getMe } from '../service';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const response = await getMe(auth.sub);

    return success(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Get me failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    if (message.includes('not found')) {
      return errors.notFound('User not found');
    }

    return errors.internal('Failed to get user');
  }
};
