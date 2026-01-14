/**
 * POST /tickers/validate - Validate ticker format and existence
 */

import type { APIGatewayProxyHandler } from 'aws-lambda';
import type { Market } from '@invest-assist/core';
import { createResponder } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { requireAuth } from '../../../shared/middleware/requireAuth';
import { validateTickerFormat, isKnownTicker } from '../service';

interface ValidateRequest {
  ticker: string;
  market: Market;
}

interface ValidateResponse {
  valid: boolean;
  formatValid: boolean;
  known: boolean;
  ticker?: {
    ticker: string;
    name: string;
    market: Market;
    type: string;
  };
  message?: string;
}

const VALID_MARKETS: Market[] = ['KRX', 'KOSDAQ', 'NYSE', 'NASDAQ'];

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    await requireAuth(event);

    if (!event.body) {
      return errors.validation('Request body is required');
    }

    const body = JSON.parse(event.body) as ValidateRequest;
    const { ticker, market } = body;

    if (!ticker) {
      return errors.validation('Ticker is required');
    }

    if (!market || !VALID_MARKETS.includes(market)) {
      return errors.validation(`Invalid market. Must be one of: ${VALID_MARKETS.join(', ')}`);
    }

    const formatValid = validateTickerFormat(ticker, market);
    const knownTicker = await isKnownTicker(ticker, market);

    const response: ValidateResponse = {
      valid: formatValid,
      formatValid,
      known: !!knownTicker,
    };

    if (knownTicker) {
      response.ticker = {
        ticker: knownTicker.ticker,
        name: knownTicker.name,
        market: knownTicker.market,
        type: knownTicker.type,
      };
    }

    if (!formatValid) {
      response.message =
        market === 'KRX' || market === 'KOSDAQ'
          ? '한국 주식 종목코드는 6자리 숫자입니다'
          : '미국 주식 티커는 1-5자리 영문 대문자입니다';
    }

    return success(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Ticker validation failed', { error: message });

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return errors.unauthorized(message);
    }

    if (error instanceof SyntaxError) {
      return errors.validation('Invalid JSON body');
    }

    return errors.internal('Failed to validate ticker');
  }
};
