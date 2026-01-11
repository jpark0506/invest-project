/**
 * PUT /plan - Create or update plan
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { upsertPlan } from '../service';
import type { UpdatePlanInput } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    const auth = await requireAuth(event);
    const body: UpdatePlanInput & { email?: string } = event.body ? JSON.parse(event.body) : {};

    const response = await upsertPlan(auth.sub, body);

    return success(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Put plan failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    if (
      message.includes('required') ||
      message.includes('sum to') ||
      message.includes('length') ||
      message.includes('between')
    ) {
      return errors.validation(message);
    }

    return errors.internal('Failed to update plan');
  }
};
