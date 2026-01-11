/**
 * Environment configuration
 */

export const config = {
  nodeEnv: process.env.NODE_ENV || 'dev',

  // DynamoDB tables
  tables: {
    users: process.env.DYNAMODB_USERS_TABLE || 'invest-assist-users-dev',
    portfolios: process.env.DYNAMODB_PORTFOLIOS_TABLE || 'invest-assist-portfolios-dev',
    plans: process.env.DYNAMODB_PLANS_TABLE || 'invest-assist-plans-dev',
    executions: process.env.DYNAMODB_EXECUTIONS_TABLE || 'invest-assist-executions-dev',
    authTokens: process.env.DYNAMODB_AUTH_TOKENS_TABLE || 'invest-assist-auth-tokens-dev',
    refreshTokens: process.env.DYNAMODB_REFRESH_TOKENS_TABLE || 'invest-assist-refresh-tokens-dev',
    notificationLogs: process.env.DYNAMODB_NOTIFICATION_LOGS_TABLE || 'invest-assist-notification-logs-dev',
  },

  // JWT
  jwtSecretArn: process.env.JWT_SECRET_ARN || '',
  jwtAccessExpiry: '30m',
  jwtRefreshExpiry: '14d',

  // SES
  sesFromEmail: process.env.SES_FROM_EMAIL || '',

  // App
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  // DynamoDB Local (for testing)
  dynamodbEndpoint: process.env.DDB_ENDPOINT,
} as const;
