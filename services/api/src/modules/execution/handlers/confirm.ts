/**
 * POST /executions/{ymCycle}/confirm - Confirm execution
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { confirmExecution } from '../service';
import type { ConfirmExecutionInput } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    const auth = await requireAuth(event);
    const ymCycle = event.pathParameters?.ymCycle;

    if (!ymCycle) {
      return errors.validation('ymCycle is required');
    }

    // Decode URL-encoded ymCycle
    const decodedYmCycle = decodeURIComponent(ymCycle);

    const body: ConfirmExecutionInput = event.body ? JSON.parse(event.body) : {};

    const response = await confirmExecution(auth.sub, decodedYmCycle, body);

    return success(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Confirm execution failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    if (message.includes('not found')) {
      return errors.notFound('Execution not found');
    }

    if (message.includes('already confirmed')) {
      return errors.conflict('Execution is already confirmed');
    }

    return errors.internal('Failed to confirm execution');
  }
};
