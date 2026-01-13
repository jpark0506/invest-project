/**
 * PUT /onboarding/complete - Complete user onboarding
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import * as userRepo from '../repo';
import type { CompleteOnboardingRequest } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    const auth = await requireAuth(event);
    const userId = auth.sub;

    if (!event.body) {
      return errors.validation('Request body is required');
    }

    const request: CompleteOnboardingRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.consents || typeof request.consents.privacy !== 'boolean') {
      return errors.validation('Privacy consent is required');
    }

    // Privacy consent must be true
    if (!request.consents.privacy) {
      return errors.validation('Privacy consent must be accepted');
    }

    const user = await userRepo.completeOnboarding(userId, request);

    logger.info('Onboarding completed', { userId });

    return success({
      ok: true,
      user: {
        id: user.userId,
        email: user.email,
        locale: user.locale,
        onboardingCompletedAt: user.onboardingCompletedAt,
        consents: user.consents,
        profile: user.profile,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Complete onboarding failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to complete onboarding');
  }
};
