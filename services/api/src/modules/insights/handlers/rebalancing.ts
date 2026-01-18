/**
 * POST /insights/rebalancing - Generate portfolio rebalancing advice
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { generateRebalancingAdvice } from '../service';
import type { RebalancingRequest } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    await requireAuth(event);

    if (!event.body) {
      return errors.validation('Request body is required');
    }

    const request: RebalancingRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.totalValue || request.totalValue <= 0) {
      return errors.validation('Valid totalValue is required');
    }

    if (!request.targetAllocations || request.targetAllocations.length === 0) {
      return errors.validation('At least one target allocation is required');
    }

    if (!request.currentHoldings || request.currentHoldings.length === 0) {
      return errors.validation('At least one current holding is required');
    }

    // Validate target allocations sum to 1
    const totalWeight = request.targetAllocations.reduce((sum, t) => sum + t.targetWeight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      return errors.validation('Target allocations must sum to 100%');
    }

    const advice = await generateRebalancingAdvice(request);

    return success({ advice });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Rebalancing advice generation failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to generate rebalancing advice');
  }
};
