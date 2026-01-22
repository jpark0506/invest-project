/**
 * POST /scheduler/trigger - Manually trigger scheduler for current user
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { logger } from '../../../shared/logger';
import { processPlanForUser } from '../service';
import { withSentry } from '../../../shared/sentry';

interface TriggerRequest {
  dryRun?: boolean;
  force?: boolean; // Skip date check - always generate for next cycle
}

const rawHandler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    // Require authentication
    const auth = await requireAuth(event);
    const userId = auth.sub;

    const body: TriggerRequest = event.body ? JSON.parse(event.body) : {};
    const dryRun = body.dryRun ?? false;
    const force = body.force ?? true; // Default to force for manual trigger

    logger.info('Manual scheduler trigger', { userId, dryRun, force });

    const result = await processPlanForUser(userId, { dryRun, force });

    // Return detailed response with full execution for preview
    return success({
      ok: result.success,
      status: result.status,
      message: result.message,
      dryRun,
      execution: result.execution ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(error.message);
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error('Manual scheduler trigger failed', { error: message });

    return errors.internal('Scheduler trigger failed');
  }
};

export const handler = withSentry(rawHandler);

