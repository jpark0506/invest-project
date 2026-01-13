/**
 * GET /auth/kakao - Redirect to Kakao OAuth login
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/logger';

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    if (!config.kakaoClientId) {
      logger.error('Kakao client ID not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kakao login not configured' }),
      };
    }

    const redirectUri = `${config.apiUrl}/auth/kakao/callback`;
    const params = new URLSearchParams({
      client_id: config.kakaoClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'account_email',
    });

    const authUrl = `${KAKAO_AUTH_URL}?${params.toString()}`;

    logger.info('Redirecting to Kakao OAuth', { redirectUri });

    return {
      statusCode: 302,
      headers: {
        Location: authUrl,
      },
      body: '',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Kakao auth redirect failed', { error: message });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to initiate Kakao login' }),
    };
  }
};
