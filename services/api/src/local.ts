/**
 * Local development server
 * Wraps Lambda handlers for local Express server
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context, APIGatewayProxyHandler } from 'aws-lambda';

// Import handlers
import { handler as authStart } from './modules/auth/handlers/start';
import { handler as authVerify } from './modules/auth/handlers/verify';
import { handler as authRefresh } from './modules/auth/handlers/refresh';
import { handler as authLogout } from './modules/auth/handlers/logout';
import { handler as userMe } from './modules/user/handlers/me';
import { handler as userUpdateLocale } from './modules/user/handlers/updateLocale';
import { handler as portfolioGet } from './modules/portfolio/handlers/get';
import { handler as portfolioPut } from './modules/portfolio/handlers/put';
import { handler as planGet } from './modules/plan/handlers/get';
import { handler as planPut } from './modules/plan/handlers/put';
import { handler as executionList } from './modules/execution/handlers/list';
import { handler as executionDetail } from './modules/execution/handlers/detail';
import { handler as executionConfirm } from './modules/execution/handlers/confirm';
import { handler as schedulerTrigger } from './modules/scheduler/handlers/trigger';
import { handler as tickerSearch } from './modules/ticker/handlers/search';
import { handler as tickerValidate } from './modules/ticker/handlers/validate';
import { handler as insightsPortfolio } from './modules/insights/handlers/portfolioBuilder';
import { handler as insightsRisk } from './modules/insights/handlers/riskSimulation';
import { handler as insightsExit } from './modules/insights/handlers/exitGuide';
import { handler as insightsRebalancing } from './modules/insights/handlers/rebalancing';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);
app.use(express.json());

// Helper to convert Express req to Lambda event
function createEvent(
  req: express.Request,
  pathParams: Record<string, string> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: req.method,
    path: req.path,
    headers: req.headers as Record<string, string>,
    queryStringParameters: req.query as Record<string, string>,
    pathParameters: pathParams,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      authorizer: {},
      httpMethod: req.method,
      identity: {
        sourceIp: req.ip || '127.0.0.1',
      },
      path: req.path,
      stage: 'local',
      requestId: `local-${Date.now()}`,
      requestTimeEpoch: Date.now(),
      resourceId: 'local',
      resourcePath: req.path,
    },
    resource: req.path,
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
  } as APIGatewayProxyEvent;
}

// Helper to send Lambda result as Express response
function sendResult(res: express.Response, result: APIGatewayProxyResult) {
  // Set headers
  if (result.headers) {
    Object.entries(result.headers).forEach(([key, value]) => {
      res.setHeader(key, String(value));
    });
  }
  if (result.multiValueHeaders) {
    Object.entries(result.multiValueHeaders).forEach(([key, values]) => {
      res.setHeader(key, values.map(String));
    });
  }

  res.status(result.statusCode);

  if (result.body) {
    try {
      res.json(JSON.parse(result.body));
    } catch {
      res.send(result.body);
    }
  } else {
    res.end();
  }
}

// Wrapper for Lambda handlers
function wrapHandler(
  handler: APIGatewayProxyHandler,
  pathParamExtractor?: (req: express.Request) => Record<string, string>
) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const pathParams = pathParamExtractor ? pathParamExtractor(req) : {};
      const event = createEvent(req, pathParams);
      const context = {} as Context;
      const result = await handler(event, context, () => {});
      if (result) {
        sendResult(res, result);
      }
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Routes
// Auth
app.post('/auth/start', wrapHandler(authStart));
app.post('/auth/verify', wrapHandler(authVerify));
app.post('/auth/refresh', wrapHandler(authRefresh));
app.post('/auth/logout', wrapHandler(authLogout));

// User
app.get('/user/me', wrapHandler(userMe));
app.patch('/user/locale', wrapHandler(userUpdateLocale));

// Portfolio
app.get('/portfolio', wrapHandler(portfolioGet));
app.put('/portfolio', wrapHandler(portfolioPut));

// Plan
app.get('/plan', wrapHandler(planGet));
app.put('/plan', wrapHandler(planPut));

// Executions
app.get('/executions', wrapHandler(executionList));
app.get(
  '/executions/:ymCycle',
  wrapHandler(executionDetail, (req) => ({ ymCycle: String(req.params.ymCycle) }))
);
app.post(
  '/executions/:ymCycle/confirm',
  wrapHandler(executionConfirm, (req) => ({ ymCycle: String(req.params.ymCycle) }))
);

// Scheduler
app.post('/scheduler/trigger', wrapHandler(schedulerTrigger));

// Ticker
app.get('/tickers/search', wrapHandler(tickerSearch));
app.post('/tickers/validate', wrapHandler(tickerValidate));

// Insights
app.post('/insights/portfolio-builder', wrapHandler(insightsPortfolio));
app.post('/insights/risk-simulation', wrapHandler(insightsRisk));
app.post('/insights/exit-guide', wrapHandler(insightsExit));
app.post('/insights/rebalancing', wrapHandler(insightsRebalancing));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running at http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'dev'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /auth/start');
  console.log('  POST /auth/verify');
  console.log('  GET  /user/me');
  console.log('  GET  /portfolio');
  console.log('  PUT  /portfolio');
  console.log('  GET  /plan');
  console.log('  PUT  /plan');
  console.log('  GET  /executions');
  console.log('  GET  /executions/:ymCycle');
  console.log('  POST /executions/:ymCycle/confirm');
});
