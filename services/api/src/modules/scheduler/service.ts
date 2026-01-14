/**
 * Scheduler service - runs daily to generate executions
 */

import { calculateExecution } from '@invest-assist/core';
import { logger } from '../../shared/logger';
import * as planRepo from '../plan/repo';
import * as portfolioRepo from '../portfolio/repo';
import * as executionRepo from '../execution/repo';
import { fetchPricesWithMarket } from './priceFetcher';
import { sendEmailNotification } from './notification';
import type { RunSchedulerInput, RunSchedulerOutput, SchedulerError } from './types';
import type { Execution, ExecutionStatus } from '@invest-assist/core';

/** Result of processing a plan */
export interface ProcessPlanResult {
  success: boolean;
  status: 'created' | 'skipped' | 'exists' | 'error';
  message: string;
  execution?: Execution;
  error?: SchedulerError;
}

/** Options for processing a plan */
interface ProcessPlanOptions {
  dryRun: boolean;
  force?: boolean; // Skip date check for manual trigger
}

/**
 * Run the scheduler to generate executions for today
 */
export async function runScheduler(input: RunSchedulerInput): Promise<RunSchedulerOutput> {
  const now = getNowInSeoul();
  const todayDay = now.getDate();
  const yearMonth = formatYearMonth(now);

  logger.info('Scheduler started', { yearMonth, todayDay, dryRun: input.dryRun });

  const result: RunSchedulerOutput = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  return result;
}

/**
 * Process a single plan for execution generation
 */
export async function processPlanForUser(
  userId: string,
  options: ProcessPlanOptions | boolean // backward compatibility: boolean = dryRun
): Promise<ProcessPlanResult> {
  // Handle backward compatibility
  const opts: ProcessPlanOptions = typeof options === 'boolean'
    ? { dryRun: options }
    : options;

  const { dryRun, force = false } = opts;

  try {
    const now = getNowInSeoul();
    const todayDay = now.getDate();
    const yearMonth = formatYearMonth(now);

    // Get active plan
    const plan = await planRepo.getActivePlan(userId);
    if (!plan) {
      return {
        success: false,
        status: 'skipped',
        message: '활성화된 투자 계획이 없습니다. 설정에서 투자 계획을 먼저 설정해주세요.',
      };
    }

    // Check if today is a run day (skip if force mode)
    if (!force && !isRunDay(plan.schedule.days, todayDay)) {
      const nextDay = getNextRunDay(plan.schedule.days, todayDay);
      return {
        success: false,
        status: 'skipped',
        message: `오늘(${todayDay}일)은 매수일이 아닙니다. 설정된 매수일: ${plan.schedule.days.join(', ')}일. 다음 매수일: ${nextDay}일`,
      };
    }

    // Get active portfolio
    const portfolio = await portfolioRepo.getActivePortfolio(userId);
    if (!portfolio) {
      return {
        success: false,
        status: 'skipped',
        message: '활성화된 포트폴리오가 없습니다. 설정에서 포트폴리오를 먼저 설정해주세요.',
      };
    }

    if (portfolio.holdings.length === 0) {
      return {
        success: false,
        status: 'skipped',
        message: '포트폴리오에 종목이 없습니다. 설정에서 종목을 추가해주세요.',
      };
    }

    // Determine cycle index
    const cycleIndex = force
      ? computeForceCycleIndex(plan.schedule.days, todayDay)
      : computeCycleIndex(plan.schedule.days, todayDay);
    const cycleWeight = plan.cycleWeights[cycleIndex - 1] ?? plan.cycleWeights[0];

    // Check if execution already exists
    const ymCycle = `${yearMonth}#${cycleIndex}`;
    const existing = await executionRepo.getExecution(userId, ymCycle);
    if (existing) {
      return {
        success: false,
        status: 'exists',
        message: `이번 달 ${cycleIndex}차 주문표가 이미 존재합니다.`,
        execution: existing,
      };
    }

    // Fetch prices with market info
    const holdingsWithMarket = portfolio.holdings.map((h) => ({
      ticker: h.ticker,
      market: h.market,
    }));

    let prices: Record<string, number>;
    try {
      prices = await fetchPricesWithMarket(holdingsWithMarket);
    } catch (error) {
      const tickerError = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        status: 'error',
        message: `종목 가격 조회 실패: ${tickerError}`,
        error: { userId, planId: plan.planId, message: tickerError },
      };
    }

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
        overheatScore: 50,
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
        try {
          await sendEmailNotification(plan.email, execution);
        } catch (emailError) {
          logger.warn('Failed to send email notification', { userId, error: emailError });
        }
      }
    }

    logger.info('Execution processed', { userId, ymCycle, dryRun });

    const modeText = dryRun ? '(테스트 모드 - 저장되지 않음)' : '';
    return {
      success: true,
      status: 'created',
      message: `${yearMonth} ${cycleIndex}차 주문표가 생성되었습니다. ${modeText}`.trim(),
      execution,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to process plan', { userId, error: message });
    return {
      success: false,
      status: 'error',
      message: `주문표 생성 중 오류가 발생했습니다: ${message}`,
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
 * Compute cycle index for forced execution (use next upcoming cycle)
 */
function computeForceCycleIndex(scheduleDays: number[], todayDay: number): number {
  const sortedDays = [...scheduleDays].sort((a, b) => a - b);

  // If today is a schedule day, use that cycle
  const exactIndex = sortedDays.indexOf(todayDay);
  if (exactIndex !== -1) {
    return exactIndex + 1;
  }

  // Find the next upcoming cycle
  for (let i = 0; i < sortedDays.length; i++) {
    if (sortedDays[i] > todayDay) {
      return i + 1;
    }
  }

  // If all days have passed, use the first cycle of next month simulation
  return 1;
}

/**
 * Get next run day from schedule
 */
function getNextRunDay(scheduleDays: number[], todayDay: number): number {
  const sortedDays = [...scheduleDays].sort((a, b) => a - b);

  for (const day of sortedDays) {
    if (day > todayDay) {
      return day;
    }
  }

  // Next month's first schedule day
  return sortedDays[0];
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
    const [year, month] = yearMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevYearMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    for (let i = 3; i >= 1; i--) {
      const prevExec = await executionRepo.getExecution(userId, `${prevYearMonth}#${i}`);
      if (prevExec) {
        return prevExec.carryByTicker || {};
      }
    }
    return {};
  }

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
