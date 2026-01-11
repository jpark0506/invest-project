/**
 * GET /plan - Get active plan
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { success, errors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { getPlan } from '../service';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const response = await getPlan(auth.sub);

    return success(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Get plan failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to get plan');
  }
};
