/**
 * GET /executions/{ymCycle} - Get execution detail
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { success, errors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { getExecutionDetail } from '../service';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const ymCycle = event.pathParameters?.ymCycle;

    if (!ymCycle) {
      return errors.validation('ymCycle is required');
    }

    // Decode URL-encoded ymCycle (e.g., "2026-01%231" -> "2026-01#1")
    const decodedYmCycle = decodeURIComponent(ymCycle);

    const response = await getExecutionDetail(auth.sub, decodedYmCycle);

    if (!response.execution) {
      return errors.notFound('Execution not found');
    }

    return success(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Get execution detail failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to get execution');
  }
};
