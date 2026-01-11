/**
 * Plan module types (re-export from core + API specific)
 */

import type { Plan, CreatePlanInput, UpdatePlanInput } from '@invest-assist/core';

export type { Plan, CreatePlanInput, UpdatePlanInput };

export interface GetPlanResponse {
  plan: Plan | null;
}

export interface PutPlanResponse {
  plan: Plan;
}
