/**
 * User repository
 */

import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../../shared/db';
import { config } from '../../shared/config';
import type { User } from './types';

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

/**
 * Create or update user by email
 * Returns existing user if found, creates new user if not
 */
export async function upsertUser(email: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    // Update lastSeen/updatedAt
    const now = new Date().toISOString();
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
    locale: 'ko-KR',
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
