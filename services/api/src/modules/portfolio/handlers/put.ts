/**
 * PUT /portfolio - Create or update portfolio
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { success, errors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { upsertPortfolio } from '../service';
import type { UpdatePortfolioInput } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const body: UpdatePortfolioInput = event.body ? JSON.parse(event.body) : {};

    const response = await upsertPortfolio(auth.sub, body);

    return success(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Put portfolio failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    if (message.includes('required') || message.includes('sum to') || message.includes('negative')) {
      return errors.validation(message);
    }

    return errors.internal('Failed to update portfolio');
  }
};
