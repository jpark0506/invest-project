/**
 * Scheduler service - runs daily to generate executions
 */

import { calculateExecution } from '@invest-assist/core';
import { logger } from '../../shared/logger';
import * as planRepo from '../plan/repo';
import * as portfolioRepo from '../portfolio/repo';
import * as executionRepo from '../execution/repo';
import { fetchPrices } from './priceFetcher';
import { sendEmailNotification } from './notification';
import type { RunSchedulerInput, RunSchedulerOutput, SchedulerError } from './types';
import type { Execution, ExecutionStatus } from '@invest-assist/core';

/**
 * Run the scheduler to generate executions for today
 */
export async function runScheduler(input: RunSchedulerInput): Promise<RunSchedulerOutput> {
  const now = getNowInSeoul();
  const todayDay = now.getDate();
  const yearMonth = formatYearMonth(now);

  logger.info('Scheduler started', { yearMonth, todayDay, dryRun: input.dryRun });

  // Get all active plans (simplified: scan all users - in production, use GSI)
  // For now, we'll need to iterate through users with active plans
  // This is a simplified implementation - in production, use activePlanIndex GSI

  const result: RunSchedulerOutput = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  // For MVP, we'll need the user to trigger this or use a different approach
  // This is a placeholder that would be called with userId from EventBridge context

  return result;
}

/**
 * Process a single plan for execution generation
 */
export async function processPlanForUser(
  userId: string,
  dryRun: boolean
): Promise<{ success: boolean; error?: SchedulerError }> {
  try {
    const now = getNowInSeoul();
    const todayDay = now.getDate();
    const yearMonth = formatYearMonth(now);

    // Get active plan
    const plan = await planRepo.getActivePlan(userId);
    if (!plan) {
      return { success: true }; // No active plan, skip
    }

    // Check if today is a run day
    if (!isRunDay(plan.schedule.days, todayDay)) {
      return { success: true }; // Not a run day, skip
    }

    // Get active portfolio
    const portfolio = await portfolioRepo.getActivePortfolio(userId);
    if (!portfolio) {
      return {
        success: false,
        error: { userId, planId: plan.planId, message: 'No active portfolio found' },
      };
    }

    // Determine cycle index
    const cycleIndex = computeCycleIndex(plan.schedule.days, todayDay);
    const cycleWeight = plan.cycleWeights[cycleIndex - 1];

    // Check if execution already exists
    const ymCycle = `${yearMonth}#${cycleIndex}`;
    const existing = await executionRepo.getExecution(userId, ymCycle);
    if (existing) {
      logger.info('Execution already exists', { userId, ymCycle });
      return { success: true };
    }

    // Fetch prices
    const tickers = portfolio.holdings.map((h: { ticker: string }) => h.ticker);
    const prices = await fetchPrices(tickers);

    // Get carry-in from previous cycle
    const carryInByTicker = await getCarryIn(userId, yearMonth, cycleIndex);

    // Calculate execution
    const calcResult = calculateExecution({
      monthlyBudget: plan.monthlyBudget,
      cycleWeight,
      holdings: portfolio.holdings,
      prices,
      carryInByTicker,
    });

    // Build execution record
    const execution: Execution = {
      userId,
      ymCycle,
      portfolioId: portfolio.portfolioId,
      planId: plan.planId,
      asOfDate: now.toISOString(),
      yearMonth,
      cycleIndex,
      cycleWeight,
      totalBudget: plan.monthlyBudget,
      cycleBudget: calcResult.cycleBudget,
      items: calcResult.items,
      carryByTicker: calcResult.carryOutByTicker,
      signals: {
        overheatScore: 50, // Placeholder - implement signal calculation
        label: 'NEUTRAL',
      },
      aiComment: null,
      status: 'GENERATED' as ExecutionStatus,
      userConfirm: {
        confirmedAt: null,
        note: null,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (!dryRun) {
      // Save execution
      await executionRepo.saveExecution(execution);

      // Update status to SENT after notification
      execution.status = 'SENT';
      await executionRepo.saveExecution(execution);

      // Send notification
      if (plan.notificationChannels.includes('EMAIL')) {
        await sendEmailNotification(plan.email, execution);
      }
    }

    logger.info('Execution processed', { userId, ymCycle, dryRun });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to process plan', { userId, error: message });
    return {
      success: false,
      error: { userId, planId: '', message },
    };
  }
}

/**
 * Check if today is a scheduled run day
 */
function isRunDay(scheduleDays: number[], todayDay: number): boolean {
  return scheduleDays.includes(todayDay);
}

/**
 * Compute cycle index (1-based) from schedule days
 */
function computeCycleIndex(scheduleDays: number[], todayDay: number): number {
  const sortedDays = [...scheduleDays].sort((a, b) => a - b);
  const index = sortedDays.indexOf(todayDay);
  return index + 1;
}

/**
 * Get carry-in from previous cycle
 */
async function getCarryIn(
  userId: string,
  yearMonth: string,
  cycleIndex: number
): Promise<Record<string, number>> {
  if (cycleIndex === 1) {
    // First cycle of month - get carry from last cycle of previous month
    const [year, month] = yearMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevYearMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    // Try to get last cycle (assuming 2 or 3 cycles)
    for (let i = 3; i >= 1; i--) {
      const prevExec = await executionRepo.getExecution(userId, `${prevYearMonth}#${i}`);
      if (prevExec) {
        return prevExec.carryByTicker || {};
      }
    }
    return {};
  }

  // Get carry from previous cycle this month
  const prevExec = await executionRepo.getExecution(userId, `${yearMonth}#${cycleIndex - 1}`);
  return prevExec?.carryByTicker || {};
}

/**
 * Get current time in Seoul timezone
 */
function getNowInSeoul(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  );
}

/**
 * Format date as YYYY-MM
 */
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
