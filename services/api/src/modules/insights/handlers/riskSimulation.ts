/**
 * POST /insights/risk-simulation - Simulate portfolio risk scenarios
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { simulateRisk } from '../service';
import type { RiskSimulationRequest } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    await requireAuth(event);

    if (!event.body) {
      return errors.validation('Request body is required');
    }

    const request: RiskSimulationRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.currentPortfolioValue || request.currentPortfolioValue <= 0) {
      return errors.validation('Valid currentPortfolioValue is required');
    }

    if (!request.holdings || request.holdings.length === 0) {
      return errors.validation('At least one holding is required');
    }

    // Validate each holding
    for (const holding of request.holdings) {
      if (!holding.ticker || !holding.value || holding.weight === undefined) {
        return errors.validation('Each holding must have ticker, value, and weight');
      }
    }

    const simulation = await simulateRisk(request);

    return success({ simulation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Risk simulation failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to simulate risk scenarios');
  }
};
