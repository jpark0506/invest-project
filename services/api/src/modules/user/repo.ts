/**
 * User repository
 */

import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../../shared/db';
import { config } from '../../shared/config';
import type { User, CompleteOnboardingRequest, UserConsents, UserProfile, AuthProvider } from './types';

const tableName = config.tables.users;

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId },
    })
  );
  return (result.Item as User) || null;
}

/**
 * Get user by email using GSI
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'emailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase().trim(),
      },
      Limit: 1,
    })
  );

  return (result.Items?.[0] as User) || null;
}

interface ProviderInfo {
  provider: AuthProvider;
  providerId: string;
  nickname?: string;
}

/**
 * Create or update user by email
 * Returns existing user if found, creates new user if not
 */
export async function upsertUser(email: string, providerInfo?: ProviderInfo): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    // Update lastSeen/updatedAt and provider info if provided
    const now = new Date().toISOString();

    if (providerInfo && !existingUser.provider) {
      // Link provider to existing user
      const updateExpr = providerInfo.nickname
        ? 'SET updatedAt = :updatedAt, provider = :provider, providerId = :providerId, nickname = :nickname'
        : 'SET updatedAt = :updatedAt, provider = :provider, providerId = :providerId';
      const exprValues: Record<string, string> = {
        ':updatedAt': now,
        ':provider': providerInfo.provider,
        ':providerId': providerInfo.providerId,
      };
      if (providerInfo.nickname) {
        exprValues[':nickname'] = providerInfo.nickname;
      }
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { userId: existingUser.userId },
          UpdateExpression: updateExpr,
          ExpressionAttributeValues: exprValues,
        })
      );
      return {
        ...existingUser,
        updatedAt: now,
        provider: providerInfo.provider,
        providerId: providerInfo.providerId,
        ...(providerInfo.nickname && { nickname: providerInfo.nickname }),
      };
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId: existingUser.userId },
        UpdateExpression: 'SET updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':updatedAt': now,
        },
      })
    );
    return { ...existingUser, updatedAt: now };
  }

  // Create new user
  const now = new Date().toISOString();
  const user: User = {
    userId: uuidv4(),
    email: normalizedEmail,
    ...(providerInfo?.nickname && { nickname: providerInfo.nickname }),
    locale: 'ko-KR',
    onboardingCompletedAt: null,
    ...(providerInfo && {
      provider: providerInfo.provider,
      providerId: providerInfo.providerId,
    }),
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: user,
    })
  );

  return user;
}

/**
 * Update user locale
 */
export async function updateUserLocale(userId: string, locale: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { userId },
      UpdateExpression: 'SET locale = :locale, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':locale': locale,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(
  userId: string,
  request: CompleteOnboardingRequest
): Promise<User> {
  const now = new Date().toISOString();

  const consents: UserConsents = {
    privacy: request.consents.privacy,
    privacyAt: now,
    marketing: request.consents.marketing,
    ...(request.consents.marketing && { marketingAt: now }),
  };

  const profile: UserProfile | undefined = request.profile
    ? {
        ...(request.profile.investmentStyle && {
          investmentStyle: request.profile.investmentStyle,
        }),
        ...(request.profile.expectedMonthlyBudget && {
          expectedMonthlyBudget: request.profile.expectedMonthlyBudget,
        }),
      }
    : undefined;

  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { userId },
      UpdateExpression:
        'SET onboardingCompletedAt = :onboardingCompletedAt, consents = :consents, profile = :profile, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':onboardingCompletedAt': now,
        ':consents': consents,
        ':profile': profile || null,
        ':updatedAt': now,
      },
    })
  );

  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found after update');
  }
  return user;
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { userId },
    })
  );
}
