/**
 * GET /executions - Get executions for a month
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { success, errors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { getExecutions } from '../service';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const yearMonth = event.queryStringParameters?.ym;

    const response = await getExecutions(auth.sub, yearMonth);

    return success(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Get executions failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to get executions');
  }
};
