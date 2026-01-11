/**
 * Auth tokens repository
 */

import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../shared/db';
import { config } from '../../shared/config';
import type { AuthToken, RefreshToken } from './types';

const authTokensTable = config.tables.authTokens;
const refreshTokensTable = config.tables.refreshTokens;

// ========== Auth Tokens (Magic Link) ==========

export async function saveAuthToken(token: AuthToken): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: authTokensTable,
      Item: token,
    })
  );
}

export async function getAuthToken(tokenHash: string): Promise<AuthToken | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: authTokensTable,
      Key: { tokenHash },
    })
  );
  return (result.Item as AuthToken) || null;
}

export async function deleteAuthToken(tokenHash: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: authTokensTable,
      Key: { tokenHash },
    })
  );
}

// ========== Refresh Tokens ==========

export async function saveRefreshToken(token: RefreshToken): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: refreshTokensTable,
      Item: token,
    })
  );
}

export async function getRefreshTokenById(tokenId: string): Promise<RefreshToken | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: refreshTokensTable,
      Key: { tokenId },
    })
  );
  return (result.Item as RefreshToken) || null;
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  // We use a simple update to set revokedAt
  const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
  await docClient.send(
    new UpdateCommand({
      TableName: refreshTokensTable,
      Key: { tokenId },
      UpdateExpression: 'SET revokedAt = :revokedAt',
      ExpressionAttributeValues: {
        ':revokedAt': new Date().toISOString(),
      },
    })
  );
}
