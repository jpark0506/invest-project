/**
 * Ticker cache repository
 * Manages ticker data in DynamoDB with TTL
 */

import {
  GetCommand,
  PutCommand,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../shared/db';
import { config } from '../../shared/config';
import type { Market } from '@invest-assist/core';

const tableName = config.tables.tickerCache;

// Cache TTL: 24 hours
const CACHE_TTL_SECONDS = 24 * 60 * 60;

export interface CachedTicker {
  tickerMarket: string; // PK: "ticker#market" e.g., "005930#KRX"
  ticker: string;
  name: string;
  market: Market;
  type: 'STOCK' | 'ETF' | 'FUND';
  currency: 'KRW' | 'USD';
  price?: number;
  updatedAt: string;
  expiresAt: number; // TTL
}

/**
 * Create ticker-market key
 */
export function createTickerKey(ticker: string, market: Market): string {
  return `${ticker}#${market}`;
}

/**
 * Get ticker from cache
 */
export async function getCachedTicker(
  ticker: string,
  market: Market
): Promise<CachedTicker | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { tickerMarket: createTickerKey(ticker, market) },
    })
  );

  return (result.Item as CachedTicker) || null;
}

/**
 * Get multiple tickers from cache
 */
export async function getCachedTickersByMarket(
  market: Market,
  limit = 100
): Promise<CachedTicker[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'marketIndex',
      KeyConditionExpression: 'market = :market',
      ExpressionAttributeValues: {
        ':market': market,
      },
      Limit: limit,
    })
  );

  return (result.Items as CachedTicker[]) || [];
}

/**
 * Save ticker to cache
 */
export async function cacheTicker(ticker: Omit<CachedTicker, 'tickerMarket' | 'updatedAt' | 'expiresAt'>): Promise<void> {
  const now = new Date();
  const item: CachedTicker = {
    ...ticker,
    tickerMarket: createTickerKey(ticker.ticker, ticker.market),
    updatedAt: now.toISOString(),
    expiresAt: Math.floor(now.getTime() / 1000) + CACHE_TTL_SECONDS,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
}

/**
 * Batch save tickers to cache
 */
export async function cacheTickersBatch(
  tickers: Omit<CachedTicker, 'tickerMarket' | 'updatedAt' | 'expiresAt'>[]
): Promise<void> {
  if (tickers.length === 0) return;

  const now = new Date();
  const expiresAt = Math.floor(now.getTime() / 1000) + CACHE_TTL_SECONDS;

  // DynamoDB batch write limit is 25 items
  const chunks = [];
  for (let i = 0; i < tickers.length; i += 25) {
    chunks.push(tickers.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const writeRequests = chunk.map((ticker) => ({
      PutRequest: {
        Item: {
          ...ticker,
          tickerMarket: createTickerKey(ticker.ticker, ticker.market),
          updatedAt: now.toISOString(),
          expiresAt,
        },
      },
    }));

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: writeRequests,
        },
      })
    );
  }
}

/**
 * Search tickers in cache by query string
 */
export async function searchCachedTickers(
  query: string,
  market?: Market,
  limit = 20
): Promise<CachedTicker[]> {
  // If market specified, query by market index
  if (market) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'marketIndex',
        KeyConditionExpression: 'market = :market',
        FilterExpression: 'contains(ticker, :query) OR contains(#name, :queryLower)',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':market': market,
          ':query': query.toUpperCase(),
          ':queryLower': query.toLowerCase(),
        },
        Limit: limit * 2, // Get more to filter
      })
    );

    return (result.Items as CachedTicker[])?.slice(0, limit) || [];
  }

  // Without market filter, scan all (less efficient but necessary)
  // In production, consider using OpenSearch for full-text search
  const koreanMarkets: Market[] = ['KRX', 'KOSDAQ'];
  const usMarkets: Market[] = ['NYSE', 'NASDAQ'];

  const results: CachedTicker[] = [];

  for (const m of [...koreanMarkets, ...usMarkets]) {
    if (results.length >= limit) break;

    const marketResults = await searchCachedTickers(query, m, limit - results.length);
    results.push(...marketResults);
  }

  return results;
}

/**
 * Check if ticker is in cache and fresh
 */
export async function isCacheFresh(ticker: string, market: Market): Promise<boolean> {
  const cached = await getCachedTicker(ticker, market);
  if (!cached) return false;

  // Consider fresh if updated within last 6 hours
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return new Date(cached.updatedAt) > sixHoursAgo;
}
