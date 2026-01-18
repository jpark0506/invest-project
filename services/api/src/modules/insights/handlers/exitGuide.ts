/**
 * POST /insights/exit-guide - Generate take-profit and stop-loss recommendations
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { generateExitGuide } from '../service';
import type { ExitGuideRequest } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    await requireAuth(event);

    if (!event.body) {
      return errors.validation('Request body is required');
    }

    const request: ExitGuideRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.ticker) {
      return errors.validation('ticker is required');
    }

    if (!request.purchasePrice || request.purchasePrice <= 0) {
      return errors.validation('Valid purchasePrice is required');
    }

    if (!request.currentPrice || request.currentPrice <= 0) {
      return errors.validation('Valid currentPrice is required');
    }

    if (!request.quantity || request.quantity <= 0) {
      return errors.validation('Valid quantity is required');
    }

    if (!request.investmentStyle || !['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'].includes(request.investmentStyle)) {
      return errors.validation('Valid investmentStyle is required (CONSERVATIVE, BALANCED, AGGRESSIVE)');
    }

    const guide = await generateExitGuide(request);

    return success({ guide });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Exit guide generation failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to generate exit guide');
  }
};
