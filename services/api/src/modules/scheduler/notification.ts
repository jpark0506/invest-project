/**
 * Notification service for sending execution alerts
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../shared/db';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import type { Execution } from '@invest-assist/core';

const ses = new SESClient({});
const notificationLogsTable = config.tables.notificationLogs;

export interface NotificationResult {
  success: boolean;
  channel: 'EMAIL' | 'TELEGRAM';
  error?: string;
}

/**
 * Send execution notification via email
 */
export async function sendEmailNotification(
  email: string,
  execution: Execution
): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: false,
    channel: 'EMAIL',
  };

  try {
    if (!config.sesFromEmail) {
      logger.warn('SES not configured, skipping email notification');
      result.success = true; // Don't fail in dev
      return result;
    }

    const subject = `[Invest Assist] ${execution.yearMonth} ${execution.cycleIndex}차 주문표`;
    const html = buildEmailHtml(execution);
    const text = buildEmailText(execution);

    await ses.send(
      new SendEmailCommand({
        Source: config.sesFromEmail,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: html, Charset: 'UTF-8' },
            Text: { Data: text, Charset: 'UTF-8' },
          },
        },
      })
    );

    result.success = true;

    // Log success
    await logNotification(execution.userId, execution.ymCycle, 'EMAIL', email, 'SUCCESS');
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);

    // Log failure
    await logNotification(
      execution.userId,
      execution.ymCycle,
      'EMAIL',
      email,
      'FAIL',
      result.error
    );

    logger.error('Failed to send email notification', {
      email,
      ymCycle: execution.ymCycle,
      error: result.error,
    });
  }

  return result;
}

/**
 * Build email HTML content
 */
function buildEmailHtml(execution: Execution): string {
  const signalColor =
    execution.signals.label === 'OVERHEAT'
      ? '#F44336'
      : execution.signals.label === 'COOL'
        ? '#00C853'
        : '#8B95A1';

  const itemsHtml = execution.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E5E8EB;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E8EB; text-align: right;">${item.price.toLocaleString()}원</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E8EB; text-align: right;">${item.shares}주</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E8EB; text-align: right;">${item.estCost.toLocaleString()}원</td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #191F28; font-size: 24px; margin-bottom: 8px;">
        ${execution.yearMonth} ${execution.cycleIndex}차 주문표
      </h2>
      <p style="color: #8B95A1; font-size: 15px; margin-bottom: 24px;">
        기준일: ${execution.asOfDate.split('T')[0]}
      </p>

      <div style="background: #F4F5F7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #8B95A1;">이번 차수 예산</span>
          <span style="color: #191F28; font-weight: 600;">${execution.cycleBudget.toLocaleString()}원</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8B95A1;">시장 신호</span>
          <span style="color: ${signalColor}; font-weight: 600;">${execution.signals.label}</span>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #F4F5F7;">
            <th style="padding: 12px; text-align: left; color: #8B95A1; font-weight: 500;">종목</th>
            <th style="padding: 12px; text-align: right; color: #8B95A1; font-weight: 500;">현재가</th>
            <th style="padding: 12px; text-align: right; color: #8B95A1; font-weight: 500;">수량</th>
            <th style="padding: 12px; text-align: right; color: #8B95A1; font-weight: 500;">금액</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <a href="${config.appUrl}/execution/${execution.ymCycle}"
         style="display: block; background: #3182F6; color: white; padding: 16px; border-radius: 12px;
                text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">
        주문표 확인하기
      </a>

      <p style="color: #8B95A1; font-size: 13px; margin-top: 24px; text-align: center;">
        이 알림은 설정하신 매수일에 자동 발송됩니다.
      </p>
    </div>
  `;
}

/**
 * Build email plain text content
 */
function buildEmailText(execution: Execution): string {
  const items = execution.items
    .map((item) => `  ${item.name}: ${item.shares}주 (${item.estCost.toLocaleString()}원)`)
    .join('\n');

  return `
${execution.yearMonth} ${execution.cycleIndex}차 주문표
기준일: ${execution.asOfDate.split('T')[0]}

이번 차수 예산: ${execution.cycleBudget.toLocaleString()}원
시장 신호: ${execution.signals.label}

종목별 주문:
${items}

주문표 확인: ${config.appUrl}/execution/${execution.ymCycle}
  `.trim();
}

/**
 * Log notification to DynamoDB
 */
async function logNotification(
  userId: string,
  executionKey: string,
  channel: 'EMAIL' | 'TELEGRAM',
  to: string,
  status: 'SUCCESS' | 'FAIL',
  errorMessage?: string
): Promise<void> {
  const now = new Date().toISOString();

  await docClient.send(
    new PutCommand({
      TableName: notificationLogsTable,
      Item: {
        userId,
        sentAtType: `${now}#${channel}`,
        executionKey,
        channel,
        to,
        status,
        errorMessage: errorMessage || null,
        createdAt: now,
      },
    })
  );
}
