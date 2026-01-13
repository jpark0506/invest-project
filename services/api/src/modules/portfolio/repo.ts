/**
 * Portfolio repository
 */

import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../../shared/db';
import { config } from '../../shared/config';
import type { Portfolio, CreatePortfolioInput, UpdatePortfolioInput } from './types';

const tableName = config.tables.portfolios;

/**
 * Get active portfolio for user
 */
export async function getActivePortfolio(userId: string): Promise<Portfolio | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isActive': true,
      },
      Limit: 1,
    })
  );

  return (result.Items?.[0] as Portfolio) || null;
}

/**
 * Get portfolio by ID
 */
export async function getPortfolioById(
  userId: string,
  portfolioId: string
): Promise<Portfolio | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId AND portfolioId = :portfolioId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':portfolioId': portfolioId,
      },
      Limit: 1,
    })
  );

  return (result.Items?.[0] as Portfolio) || null;
}

/**
 * Create a new portfolio
 */
export async function createPortfolio(
  userId: string,
  input: CreatePortfolioInput
): Promise<Portfolio> {
  const now = new Date().toISOString();

  const portfolio: Portfolio = {
    portfolioId: uuidv4(),
    userId,
    name: input.name,
    accountTypes: input.accountTypes || [],
    markets: input.markets || ['KRX'],
    themes: input.themes || [],
    holdings: input.holdings,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  // If this portfolio is active, deactivate others
  if (portfolio.isActive) {
    await deactivateAllPortfolios(userId);
  }

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: portfolio,
    })
  );

  return portfolio;
}

/**
 * Update an existing portfolio
 */
export async function updatePortfolio(
  userId: string,
  portfolioId: string,
  input: UpdatePortfolioInput
): Promise<Portfolio | null> {
  const existing = await getPortfolioById(userId, portfolioId);
  if (!existing) {
    return null;
  }

  // If setting to active, deactivate others first
  if (input.isActive === true && !existing.isActive) {
    await deactivateAllPortfolios(userId);
  }

  const updateExpressions: string[] = ['updatedAt = :updatedAt'];
  const expressionValues: Record<string, unknown> = {
    ':updatedAt': new Date().toISOString(),
  };

  if (input.name !== undefined) {
    updateExpressions.push('name = :name');
    expressionValues[':name'] = input.name;
  }
  if (input.accountTypes !== undefined) {
    updateExpressions.push('accountTypes = :accountTypes');
    expressionValues[':accountTypes'] = input.accountTypes;
  }
  if (input.markets !== undefined) {
    updateExpressions.push('markets = :markets');
    expressionValues[':markets'] = input.markets;
  }
  if (input.themes !== undefined) {
    updateExpressions.push('themes = :themes');
    expressionValues[':themes'] = input.themes;
  }
  if (input.holdings !== undefined) {
    updateExpressions.push('holdings = :holdings');
    expressionValues[':holdings'] = input.holdings;
  }
  if (input.isActive !== undefined) {
    updateExpressions.push('isActive = :isActive');
    expressionValues[':isActive'] = input.isActive;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { userId, portfolioId },
      UpdateExpression: 'SET ' + updateExpressions.join(', '),
      ExpressionAttributeValues: expressionValues,
    })
  );

  return getPortfolioById(userId, portfolioId);
}

/**
 * Deactivate all portfolios for a user
 */
async function deactivateAllPortfolios(userId: string): Promise<void> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isActive': true,
      },
    })
  );

  const portfolios = result.Items as Portfolio[];

  for (const portfolio of portfolios) {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId, portfolioId: portfolio.portfolioId },
        UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isActive': false,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );
  }
}
