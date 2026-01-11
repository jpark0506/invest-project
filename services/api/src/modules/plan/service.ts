/**
 * Plan service
 */

import * as planRepo from './repo';
import type { Plan, UpdatePlanInput, GetPlanResponse, PutPlanResponse } from './types';

const EPSILON = 0.001;

/**
 * Get active plan for user
 */
export async function getPlan(userId: string): Promise<GetPlanResponse> {
  const plan = await planRepo.getActivePlan(userId);
  return { plan };
}

/**
 * Create or update plan
 */
export async function upsertPlan(
  userId: string,
  input: UpdatePlanInput & { email?: string }
): Promise<PutPlanResponse> {
  // Validate cycle weights if provided
  if (input.cycleWeights) {
    validateCycleWeights(input.cycleWeights, input.cycleCount);
  }

  const existing = await planRepo.getActivePlan(userId);

  let plan: Plan;

  if (existing) {
    // Update existing
    const updated = await planRepo.updatePlan(userId, existing.planId, input);
    if (!updated) {
      throw new Error('Failed to update plan');
    }
    plan = updated;
  } else {
    // Create new - require all fields
    if (input.monthlyBudget === undefined) {
      throw new Error('monthlyBudget is required when creating a new plan');
    }
    if (input.cycleCount === undefined) {
      throw new Error('cycleCount is required when creating a new plan');
    }
    if (input.cycleWeights === undefined) {
      throw new Error('cycleWeights is required when creating a new plan');
    }
    if (input.schedule === undefined) {
      throw new Error('schedule is required when creating a new plan');
    }
    if (!input.email) {
      throw new Error('email is required when creating a new plan');
    }

    plan = await planRepo.createPlan(userId, {
      monthlyBudget: input.monthlyBudget,
      cycleCount: input.cycleCount,
      cycleWeights: input.cycleWeights,
      schedule: input.schedule,
      notificationChannels: input.notificationChannels,
      email: input.email,
      telegramChatId: input.telegramChatId,
      isActive: true,
    });
  }

  return { plan };
}

/**
 * Validate cycle weights
 */
function validateCycleWeights(weights: number[], cycleCount?: number): void {
  const count = cycleCount ?? weights.length;

  if (weights.length !== count) {
    throw new Error(`cycleWeights length (${weights.length}) must match cycleCount (${count})`);
  }

  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (Math.abs(sum - 1.0) > EPSILON) {
    throw new Error(`cycleWeights must sum to 1.0, got ${sum.toFixed(4)}`);
  }

  for (const weight of weights) {
    if (weight <= 0 || weight > 1) {
      throw new Error(`Each cycleWeight must be between 0 (exclusive) and 1 (inclusive)`);
    }
  }
}
