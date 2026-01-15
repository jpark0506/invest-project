/**
 * Execution repository
 */

import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../shared/db';
import { config } from '../../shared/config';
import type { Execution, ExecutionSummary } from './types';

const tableName = config.tables.executions;

/**
 * Get executions for a user by year-month
 */
export async function getExecutionsByMonth(
  userId: string,
  yearMonth: string
): Promise<ExecutionSummary[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId AND begins_with(ymCycle, :yearMonth)',
      FilterExpression: 'attribute_not_exists(deletedAt) OR deletedAt = :null',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':yearMonth': yearMonth,
        ':null': null,
      },
    })
  );

  return (result.Items || []).map((item) => ({
    ymCycle: item.ymCycle,
    yearMonth: item.yearMonth,
    cycleIndex: item.cycleIndex,
    asOfDate: item.asOfDate,
    status: item.status,
    cycleBudget: item.cycleBudget,
    signals: {
      overheatScore: item.signals?.overheatScore ?? 0,
      label: item.signals?.label ?? 'NEUTRAL',
    },
  })) as ExecutionSummary[];
}

/**
 * Get execution by ymCycle
 */
export async function getExecution(userId: string, ymCycle: string): Promise<Execution | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId, ymCycle },
    })
  );

  const item = result.Item as Execution | undefined;

  // Return null if not found or soft-deleted
  if (!item || item.deletedAt) {
    return null;
  }

  return item;
}

/**
 * Save execution
 */
export async function saveExecution(execution: Execution): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: execution,
    })
  );
}

/**
 * Soft delete execution
 */
export async function softDeleteExecution(userId: string, ymCycle: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { userId, ymCycle },
      UpdateExpression: 'SET deletedAt = :deletedAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':deletedAt': new Date().toISOString(),
        ':updatedAt': new Date().toISOString(),
      },
    })
  );
}

/**
 * Confirm execution
 */
export async function confirmExecution(
  userId: string,
  ymCycle: string,
  note: string | null,
  confirmedAt: string
): Promise<Execution | null> {
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { userId, ymCycle },
      UpdateExpression:
        'SET #status = :status, userConfirm.confirmedAt = :confirmedAt, userConfirm.note = :note, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'CONFIRMED',
        ':confirmedAt': confirmedAt,
        ':note': note,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );

  return getExecution(userId, ymCycle);
}
