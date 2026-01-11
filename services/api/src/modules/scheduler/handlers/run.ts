/**
 * POST /internal/run-scheduler - Run scheduler (internal/EventBridge)
 * Also: EventBridge scheduled trigger
 */

import type { APIGatewayProxyHandler, ScheduledHandler } from 'aws-lambda';
import { success, errors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { runScheduler } from '../service';
import type { RunSchedulerInput } from '../types';

/**
 * HTTP handler for manual/API trigger
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Add internal authentication (API key / IP whitelist)

    const body: RunSchedulerInput = event.body ? JSON.parse(event.body) : {};

    const result = await runScheduler(body);

    return success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Scheduler run failed', { error: message });

    return errors.internal('Scheduler failed');
  }
};

/**
 * EventBridge scheduled handler
 */
export const scheduledHandler: ScheduledHandler = async (event) => {
  logger.info('Scheduler triggered by EventBridge', { event });

  try {
    const result = await runScheduler({ dryRun: false });

    logger.info('Scheduler completed', {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
    });
  } catch (error) {
    logger.error('Scheduler run failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error; // Re-throw to mark Lambda as failed
  }
};
