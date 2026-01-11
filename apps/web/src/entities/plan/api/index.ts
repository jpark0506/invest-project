import { apiClient } from '@/shared/api';
import type { Plan, UpdatePlanInput } from '@invest-assist/core';

export type { Plan, UpdatePlanInput };

export interface GetPlanResponse {
  plan: Plan | null;
}

export interface PutPlanResponse {
  plan: Plan;
}

export const planApi = {
  get: () => apiClient.get<GetPlanResponse>('/plan'),

  update: (data: UpdatePlanInput & { email?: string }) =>
    apiClient.put<PutPlanResponse>('/plan', data),
};
