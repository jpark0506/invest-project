/**
 * SQS Worker - Background ticker fetching
 * Processes messages from the ticker fetch queue
 */

import type { SQSHandler, SQSRecord } from 'aws-lambda';
import type { Market } from '@invest-assist/core';
import { logger } from '../../../shared/logger';
import { fetchAndCacheTicker } from '../service';

interface TickerFetchMessage {
  ticker: string;
  market: Market;
  source: 'search' | 'refresh' | 'manual';
}

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const message = JSON.parse(record.body) as TickerFetchMessage;
    const { ticker, market, source } = message;

    logger.info('Processing ticker fetch', { ticker, market, source });

    await fetchAndCacheTicker(ticker, market);
  } catch (error) {
    logger.error('Failed to process ticker fetch record', {
      error,
      body: record.body,
    });
    throw error; // Rethrow to trigger retry
  }
}

export const handler: SQSHandler = async (event) => {
  logger.info('Ticker fetch worker started', { recordCount: event.Records.length });

  const results = await Promise.allSettled(
    event.Records.map((record) => processRecord(record))
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    logger.error('Some ticker fetches failed', { failedCount: failed.length });
    // Note: Failed messages will be retried by SQS
  }

  logger.info('Ticker fetch worker completed', {
    total: event.Records.length,
    succeeded: results.filter((r) => r.status === 'fulfilled').length,
    failed: failed.length,
  });
};
