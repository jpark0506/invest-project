/**
 * Auth service
 */

import { v4 as uuidv4 } from 'uuid';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { generateToken, hashToken } from '../../shared/crypto';
import { generateAccessToken } from '../../shared/jwt';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import * as authRepo from './repo';
import * as userRepo from '../user/repo';
import type { VerifyAuthResponse } from './types';

const ses = new SESClient({});

const AUTH_TOKEN_TTL_MINUTES = 15;
const REFRESH_TOKEN_TTL_DAYS = 14;

/**
 * Start auth flow by sending magic link email
 */
export async function startAuth(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  // Generate token
  const token = generateToken();
  const tokenHash = hashToken(token);

  // Calculate expiry (15 minutes from now)
  const expiresAt = Math.floor(Date.now() / 1000) + AUTH_TOKEN_TTL_MINUTES * 60;

  // Save token
  await authRepo.saveAuthToken({
    tokenHash,
    email: normalizedEmail,
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  // Build magic link
  const magicLink = `${config.appUrl}/auth/callback?token=${token}`;

  // Send email
  await sendMagicLinkEmail(normalizedEmail, magicLink);

  logger.info('Magic link sent', { email: normalizedEmail });
}

/**
 * Send magic link email via SES
 */
async function sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
  // Skip email in development if no SES email configured
  if (config.nodeEnv === 'dev' && !config.sesFromEmail) {
    logger.info('Skipping email in dev mode', { email, magicLink });
    return;
  }

  const command = new SendEmailCommand({
    Source: config.sesFromEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: '[Invest Assist] 로그인 링크',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #191F28; font-size: 24px; margin-bottom: 16px;">로그인</h2>
              <p style="color: #4E5968; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                아래 버튼을 클릭하여 Invest Assist에 로그인하세요.<br>
                이 링크는 15분 후에 만료됩니다.
              </p>
              <a href="${magicLink}"
                 style="display: inline-block; background: #3182F6; color: white; padding: 14px 28px;
                        border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px;">
                로그인하기
              </a>
              <p style="color: #8B95A1; font-size: 13px; margin-top: 24px;">
                이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.
              </p>
            </div>
          `,
          Charset: 'UTF-8',
        },
        Text: {
          Data: `Invest Assist 로그인\n\n아래 링크를 클릭하여 로그인하세요:\n${magicLink}\n\n이 링크는 15분 후에 만료됩니다.`,
          Charset: 'UTF-8',
        },
      },
    },
  });

  await ses.send(command);
}

/**
 * Verify magic link token and create session
 */
export async function verifyAuth(token: string): Promise<{
  response: VerifyAuthResponse;
  refreshToken: string;
  refreshTokenId: string;
}> {
  const tokenHash = hashToken(token);

  // Get and validate token
  const authToken = await authRepo.getAuthToken(tokenHash);

  if (!authToken) {
    throw new Error('Invalid or expired token');
  }

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (authToken.expiresAt < now) {
    await authRepo.deleteAuthToken(tokenHash);
    throw new Error('Token has expired');
  }

  // Delete token (one-time use)
  await authRepo.deleteAuthToken(tokenHash);

  // Upsert user
  const user = await userRepo.upsertUser(authToken.email);

  // Generate tokens
  const accessToken = await generateAccessToken({
    sub: user.userId,
    email: user.email,
  });

  const refreshToken = generateToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenId = uuidv4();

  // Save refresh token
  const refreshExpiresAt = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;

  await authRepo.saveRefreshToken({
    tokenId: refreshTokenId,
    userId: user.userId,
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpiresAt,
    createdAt: new Date().toISOString(),
  });

  logger.info('User authenticated', { userId: user.userId });

  return {
    response: {
      user: {
        id: user.userId,
        email: user.email,
        locale: user.locale,
        onboardingCompletedAt: user.onboardingCompletedAt ?? null,
        consents: user.consents,
        profile: user.profile,
      },
      accessToken,
    },
    refreshToken,
    refreshTokenId,
  };
}

/**
 * Refresh access token
 */
export async function refreshAuth(refreshTokenId: string): Promise<{
  accessToken: string;
  newRefreshToken?: string;
  newRefreshTokenId?: string;
}> {
  const storedToken = await authRepo.getRefreshTokenById(refreshTokenId);

  if (!storedToken) {
    throw new Error('Invalid refresh token');
  }

  if (storedToken.revokedAt) {
    throw new Error('Refresh token has been revoked');
  }

  const now = Math.floor(Date.now() / 1000);
  if (storedToken.expiresAt < now) {
    throw new Error('Refresh token has expired');
  }

  // Get user
  const user = await userRepo.getUserById(storedToken.userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Generate new access token
  const accessToken = await generateAccessToken({
    sub: user.userId,
    email: user.email,
  });

  // Token rotation: issue new refresh token and revoke old one
  const newRefreshToken = generateToken();
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const newRefreshTokenId = uuidv4();
  const refreshExpiresAt = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;

  await authRepo.revokeRefreshToken(refreshTokenId);
  await authRepo.saveRefreshToken({
    tokenId: newRefreshTokenId,
    userId: user.userId,
    tokenHash: newRefreshTokenHash,
    expiresAt: refreshExpiresAt,
    createdAt: new Date().toISOString(),
  });

  return {
    accessToken,
    newRefreshToken,
    newRefreshTokenId,
  };
}

/**
 * Logout by revoking refresh token
 */
export async function logout(refreshTokenId: string): Promise<void> {
  await authRepo.revokeRefreshToken(refreshTokenId);
  logger.info('User logged out', { refreshTokenId });
}

/**
 * Verify Kakao OAuth and create session
 */
export async function verifyKakaoAuth(
  email: string,
  kakaoId: string,
  nickname?: string
): Promise<{
  response: VerifyAuthResponse;
  refreshToken: string;
  refreshTokenId: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // Upsert user with kakao provider info
  const user = await userRepo.upsertUser(normalizedEmail, {
    provider: 'kakao',
    providerId: kakaoId,
    nickname,
  });

  // Generate tokens
  const accessToken = await generateAccessToken({
    sub: user.userId,
    email: user.email,
  });

  const refreshToken = generateToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenId = uuidv4();

  // Save refresh token
  const refreshExpiresAt = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;

  await authRepo.saveRefreshToken({
    tokenId: refreshTokenId,
    userId: user.userId,
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpiresAt,
    createdAt: new Date().toISOString(),
  });

  logger.info('User authenticated via Kakao', { userId: user.userId, kakaoId });

  return {
    response: {
      user: {
        id: user.userId,
        email: user.email,
        nickname: user.nickname,
        locale: user.locale,
        onboardingCompletedAt: user.onboardingCompletedAt ?? null,
        consents: user.consents,
        profile: user.profile,
      },
      accessToken,
    },
    refreshToken,
    refreshTokenId,
  };
}
