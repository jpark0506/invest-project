/**
 * DELETE /executions/{ymCycle} - Soft delete execution
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import * as executionRepo from '../repo';

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

    // Get execution to check if it exists and its status
    const execution = await executionRepo.getExecution(auth.sub, decodedYmCycle);

    if (!execution) {
      return errors.notFound('Execution not found');
    }

    // Only allow deletion of non-confirmed executions
    if (execution.status === 'CONFIRMED') {
      return errors.conflict('Cannot delete confirmed execution');
    }

    // Soft delete
    await executionRepo.softDeleteExecution(auth.sub, decodedYmCycle);

    return success({ ok: true, message: 'Execution deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Delete execution failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to delete execution');
  }
};
