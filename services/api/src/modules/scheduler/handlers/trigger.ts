/**
 * POST /scheduler/trigger - Manually trigger scheduler for current user
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { logger } from '../../../shared/logger';
import { processPlanForUser } from '../service';

interface TriggerRequest {
  dryRun?: boolean;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    // Require authentication
    const auth = await requireAuth(event);
    const userId = auth.sub;

    const body: TriggerRequest = event.body ? JSON.parse(event.body) : {};
    const dryRun = body.dryRun ?? false;

    logger.info('Manual scheduler trigger', { userId, dryRun });

    const result = await processPlanForUser(userId, dryRun);

    if (!result.success) {
      return errors.validation(result.error?.message || 'Failed to process plan');
    }

    return success({ ok: true, dryRun });
  } catch (error) {
    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(error.message);
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error('Manual scheduler trigger failed', { error: message });

    return errors.internal('Scheduler trigger failed');
  }
};
