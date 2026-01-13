/**
 * GET /tickers/search - Search for tickers
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import type { Market } from '@invest-assist/core';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { searchTickers } from '../service';

const VALID_MARKETS: Market[] = ['KRX', 'KOSDAQ', 'NYSE', 'NASDAQ'];

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    // Require authentication
    await requireAuth(event);

    // Get query parameters
    const query = event.queryStringParameters?.q || '';
    const marketParam = event.queryStringParameters?.market;

    // Validate market parameter
    let market: Market | undefined;
    if (marketParam) {
      if (!VALID_MARKETS.includes(marketParam as Market)) {
        return errors.validation(`Invalid market. Must be one of: ${VALID_MARKETS.join(', ')}`);
      }
      market = marketParam as Market;
    }

    // Validate query
    if (!query || query.length < 1) {
      return errors.validation('Query parameter "q" is required');
    }

    if (query.length > 50) {
      return errors.validation('Query too long (max 50 characters)');
    }

    // Search tickers
    const result = await searchTickers(query, market);

    return success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Ticker search failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    return errors.internal('Failed to search tickers');
  }
};
