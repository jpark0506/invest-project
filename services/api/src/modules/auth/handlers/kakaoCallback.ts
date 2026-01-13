/**
 * GET /auth/kakao/callback - Handle Kakao OAuth callback
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/logger';
import { verifyKakaoAuth } from '../service';

const REFRESH_TOKEN_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

interface KakaoUserResponse {
  id: number;
  properties?: {
    nickname?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
    };
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const code = event.queryStringParameters?.code;
    const error = event.queryStringParameters?.error;

    if (error) {
      logger.error('Kakao OAuth error', { error });
      return redirectToFrontendWithError('kakao_auth_denied');
    }

    if (!code) {
      logger.error('No authorization code provided');
      return redirectToFrontendWithError('missing_code');
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    if (!tokenResponse) {
      return redirectToFrontendWithError('token_exchange_failed');
    }

    // Get user info from Kakao
    const kakaoUser = await getKakaoUserInfo(tokenResponse.access_token);
    if (!kakaoUser) {
      logger.error('Failed to get Kakao user info');
      return redirectToFrontendWithError('user_info_failed');
    }

    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.properties?.nickname ||
                     kakaoUser.kakao_account?.profile?.nickname ||
                     `사용자${kakaoId.slice(-4)}`;

    logger.info('Kakao user authenticated', { kakaoId, nickname });

    // Create or get user and generate tokens (use kakao_{id}@kakao.local as placeholder email)
    const placeholderEmail = `kakao_${kakaoId}@kakao.local`;
    const { response, refreshToken, refreshTokenId } = await verifyKakaoAuth(
      placeholderEmail,
      kakaoId,
      nickname
    );

    // Build refresh token cookie
    const cookie = buildRefreshCookie(refreshTokenId, refreshToken);

    // Redirect to frontend with access token
    const frontendUrl = new URL('/auth/callback', config.appUrl);
    frontendUrl.searchParams.set('provider', 'kakao');
    frontendUrl.searchParams.set('accessToken', response.accessToken);

    return {
      statusCode: 302,
      headers: {
        Location: frontendUrl.toString(),
        'Set-Cookie': cookie,
      },
      body: '',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Kakao callback failed', { error: message });
    return redirectToFrontendWithError('internal_error');
  }
};

async function exchangeCodeForToken(code: string): Promise<KakaoTokenResponse | null> {
  try {
    const redirectUri = `${config.apiUrl}/auth/kakao/callback`;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.kakaoClientId,
      client_secret: config.kakaoClientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Kakao token exchange failed', { status: response.status, error: errorText });
      return null;
    }

    return (await response.json()) as KakaoTokenResponse;
  } catch (error) {
    logger.error('Kakao token exchange error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function getKakaoUserInfo(accessToken: string): Promise<KakaoUserResponse | null> {
  try {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Kakao user info failed', { status: response.status, error: errorText });
      return null;
    }

    return (await response.json()) as KakaoUserResponse;
  } catch (error) {
    logger.error('Kakao user info error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function redirectToFrontendWithError(errorCode: string): {
  statusCode: number;
  headers: { Location: string };
  body: string;
} {
  const frontendUrl = new URL('/auth/callback', config.appUrl);
  frontendUrl.searchParams.set('error', errorCode);
  frontendUrl.searchParams.set('provider', 'kakao');

  return {
    statusCode: 302,
    headers: {
      Location: frontendUrl.toString(),
    },
    body: '',
  };
}

function buildRefreshCookie(tokenId: string, token: string): string {
  const value = `${tokenId}:${token}`;
  const parts = [
    `refresh=${value}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${REFRESH_TOKEN_MAX_AGE}`,
    'SameSite=None',
    'Secure',
  ];

  return parts.join('; ');
}
