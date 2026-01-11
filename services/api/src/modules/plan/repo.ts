/**
 * Plan repository
 */

import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../../shared/db';
import { config } from '../../shared/config';
import type { Plan, CreatePlanInput, UpdatePlanInput } from './types';

const tableName = config.tables.plans;

/**
 * Get active plan for user
 */
export async function getActivePlan(userId: string): Promise<Plan | null> {
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

  return (result.Items?.[0] as Plan) || null;
}

/**
 * Get plan by ID
 */
export async function getPlanById(userId: string, planId: string): Promise<Plan | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId AND planId = :planId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':planId': planId,
      },
      Limit: 1,
    })
  );

  return (result.Items?.[0] as Plan) || null;
}

/**
 * Create a new plan
 */
export async function createPlan(userId: string, input: CreatePlanInput): Promise<Plan> {
  const now = new Date().toISOString();

  const plan: Plan = {
    planId: uuidv4(),
    userId,
    monthlyBudget: input.monthlyBudget,
    currency: input.currency || 'KRW',
    cycleCount: input.cycleCount,
    cycleWeights: input.cycleWeights,
    schedule: input.schedule,
    notificationChannels: input.notificationChannels || ['EMAIL'],
    email: input.email,
    telegramChatId: input.telegramChatId || null,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  // If this plan is active, deactivate others
  if (plan.isActive) {
    await deactivateAllPlans(userId);
  }

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: plan,
    })
  );

  return plan;
}

/**
 * Update an existing plan
 */
export async function updatePlan(
  userId: string,
  planId: string,
  input: UpdatePlanInput
): Promise<Plan | null> {
  const existing = await getPlanById(userId, planId);
  if (!existing) {
    return null;
  }

  // If setting to active, deactivate others first
  if (input.isActive === true && !existing.isActive) {
    await deactivateAllPlans(userId);
  }

  const updateExpressions: string[] = ['updatedAt = :updatedAt'];
  const expressionValues: Record<string, unknown> = {
    ':updatedAt': new Date().toISOString(),
  };

  if (input.monthlyBudget !== undefined) {
    updateExpressions.push('monthlyBudget = :monthlyBudget');
    expressionValues[':monthlyBudget'] = input.monthlyBudget;
  }
  if (input.cycleCount !== undefined) {
    updateExpressions.push('cycleCount = :cycleCount');
    expressionValues[':cycleCount'] = input.cycleCount;
  }
  if (input.cycleWeights !== undefined) {
    updateExpressions.push('cycleWeights = :cycleWeights');
    expressionValues[':cycleWeights'] = input.cycleWeights;
  }
  if (input.schedule !== undefined) {
    updateExpressions.push('schedule = :schedule');
    expressionValues[':schedule'] = input.schedule;
  }
  if (input.notificationChannels !== undefined) {
    updateExpressions.push('notificationChannels = :notificationChannels');
    expressionValues[':notificationChannels'] = input.notificationChannels;
  }
  if (input.email !== undefined) {
    updateExpressions.push('email = :email');
    expressionValues[':email'] = input.email;
  }
  if (input.telegramChatId !== undefined) {
    updateExpressions.push('telegramChatId = :telegramChatId');
    expressionValues[':telegramChatId'] = input.telegramChatId;
  }
  if (input.isActive !== undefined) {
    updateExpressions.push('isActive = :isActive');
    expressionValues[':isActive'] = input.isActive;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { userId, planId },
      UpdateExpression: 'SET ' + updateExpressions.join(', '),
      ExpressionAttributeValues: expressionValues,
    })
  );

  return getPlanById(userId, planId);
}

/**
 * Deactivate all plans for a user
 */
async function deactivateAllPlans(userId: string): Promise<void> {
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

  const plans = result.Items as Plan[];

  for (const plan of plans) {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId, planId: plan.planId },
        UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isActive': false,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );
  }
}
