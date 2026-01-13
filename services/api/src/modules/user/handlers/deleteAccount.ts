/**
 * DELETE /account - Delete user account
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponder } from '../../../shared/response';
import { verifyAccessToken } from '../../../shared/jwt';
import { logger } from '../../../shared/logger';
import * as userRepo from '../repo';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    // Get authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return errors.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);

    if (!payload?.sub) {
      return errors.unauthorized('Invalid token');
    }

    const userId = payload.sub;

    // Delete user account
    await userRepo.deleteUser(userId);

    logger.info('User account deleted', { userId });

    return success({ ok: true, message: 'Account deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Delete account failed', { error: message });

    if (message.includes('Invalid') || message.includes('expired')) {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to delete account');
  }
};
