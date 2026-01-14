/**
 * Ticker fetch queue service
 * Manages SQS messages for background ticker fetching
 */

import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import type { Market } from '@invest-assist/core';

const sqsClient = new SQSClient({});
const queueUrl = config.sqs.tickerFetchQueueUrl;

export interface TickerFetchMessage {
  ticker: string;
  market: Market;
  source: 'search' | 'refresh' | 'manual';
}

/**
 * Queue a single ticker for fetching
 */
export async function queueTickerFetch(message: TickerFetchMessage): Promise<void> {
  if (!queueUrl) {
    logger.warn('SQS queue URL not configured, skipping queue');
    return;
  }

  try {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageGroupId: message.market, // Group by market for ordering
      })
    );
    logger.info('Queued ticker fetch', { ticker: message.ticker, market: message.market });
  } catch (error) {
    logger.error('Failed to queue ticker fetch', { error, message });
  }
}

/**
 * Queue multiple tickers for fetching
 */
export async function queueTickerFetchBatch(messages: TickerFetchMessage[]): Promise<void> {
  if (!queueUrl) {
    logger.warn('SQS queue URL not configured, skipping queue');
    return;
  }

  if (messages.length === 0) return;

  // SQS batch limit is 10 messages
  const chunks = [];
  for (let i = 0; i < messages.length; i += 10) {
    chunks.push(messages.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    try {
      await sqsClient.send(
        new SendMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: chunk.map((msg, idx) => ({
            Id: `${idx}`,
            MessageBody: JSON.stringify(msg),
          })),
        })
      );
      logger.info('Queued ticker fetch batch', { count: chunk.length });
    } catch (error) {
      logger.error('Failed to queue ticker fetch batch', { error });
    }
  }
}
