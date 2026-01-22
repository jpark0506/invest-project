/**
 * POST /insights/portfolio-builder - Generate AI portfolio recommendation
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { generatePortfolioRecommendation } from '../service';
import type { PortfolioBuilderRequest } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    await requireAuth(event);

    if (!event.body) {
      return errors.validation('Request body is required');
    }

    const request: PortfolioBuilderRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.investmentStyle || !['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'].includes(request.investmentStyle)) {
      return errors.validation('Valid investmentStyle is required (CONSERVATIVE, BALANCED, AGGRESSIVE)');
    }

    if (!request.investmentPeriod || !['3M', '6M', '1Y'].includes(request.investmentPeriod)) {
      return errors.validation('Valid investmentPeriod is required (3M, 6M, 1Y)');
    }

    if (!request.investmentAmount || request.investmentAmount <= 0) {
      return errors.validation('Valid investmentAmount is required');
    }

    if (!request.interestedMarkets || request.interestedMarkets.length === 0) {
      return errors.validation('At least one interested market is required');
    }

    const recommendation = await generatePortfolioRecommendation(request);

    return success({ recommendation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Portfolio builder failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to generate portfolio recommendation');
  }
};