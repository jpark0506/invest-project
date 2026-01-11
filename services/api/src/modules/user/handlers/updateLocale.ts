/**
 * PUT /settings/locale - Update user locale
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { success, errors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { updateLocale } from '../service';

interface UpdateLocaleBody {
  locale?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const body: UpdateLocaleBody = event.body ? JSON.parse(event.body) : {};

    if (!body.locale) {
      return errors.validation('Locale is required');
    }

    await updateLocale(auth.sub, body.locale);

    return success({ ok: true, locale: body.locale });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Update locale failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    if (message.includes('Invalid locale')) {
      return errors.validation(message);
    }

    return errors.internal('Failed to update locale');
  }
};
