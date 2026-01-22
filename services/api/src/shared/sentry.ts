import * as Sentry from '@sentry/serverless';
import type { Handler } from 'aws-lambda';

// Initialize Sentry
// DSN is read from SENTRY_DSN environment variable automatically if not provided,
// but providing it explicitly is also fine.
Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE 
    ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) 
    : 0.1, // Default to 10% sampling
  environment: process.env.NODE_ENV || 'dev',
  enabled: !!process.env.SENTRY_DSN, // Only enable if DSN is present
});

/**
 * Wraps a Lambda handler with Sentry
 */
export const withSentry = (handler: Handler) => {
  return Sentry.AWSLambda.wrapHandler(handler);
};
