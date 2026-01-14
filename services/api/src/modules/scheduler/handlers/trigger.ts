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
  force?: boolean; // Skip date check - always generate for next cycle
}

export const handler: APIGatewayProxyHandler = async (event) => {
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

    // Return detailed response
    return success({
      ok: result.success,
      status: result.status,
      message: result.message,
      dryRun,
      execution: result.execution ? {
        ymCycle: result.execution.ymCycle,
        yearMonth: result.execution.yearMonth,
        cycleIndex: result.execution.cycleIndex,
        cycleBudget: result.execution.cycleBudget,
        itemCount: result.execution.items.length,
      } : null,
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
