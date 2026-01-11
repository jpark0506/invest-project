/**
 * Plan model types
 * Based on schema.md specification
 */

/** Schedule type */
export type ScheduleType = 'MONTHLY_DAYS';

/** Notification channel */
export type NotificationChannel = 'EMAIL' | 'TELEGRAM';

/** Plan schedule configuration */
export interface PlanSchedule {
  type: ScheduleType;
  days: number[]; // e.g., [5, 19]
  timezone: string; // e.g., 'Asia/Seoul'
}

/** Investment plan entity */
export interface Plan {
  planId: string;
  userId: string;
  monthlyBudget: number; // KRW
  currency: string; // 'KRW' for MVP
  cycleCount: number; // 2 or 3
  cycleWeights: number[]; // e.g., [0.5, 0.5] or [0.4, 0.3, 0.3]
  schedule: PlanSchedule;
  notificationChannels: NotificationChannel[];
  email: string;
  telegramChatId: string | null;
  isActive: boolean;
  nextRunAt?: string; // ISO, for scheduler
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Plan creation input */
export interface CreatePlanInput {
  monthlyBudget: number;
  currency?: string;
  cycleCount: number;
  cycleWeights: number[];
  schedule: PlanSchedule;
  notificationChannels?: NotificationChannel[];
  email: string;
  telegramChatId?: string | null;
  isActive?: boolean;
}

/** Plan update input */
export interface UpdatePlanInput {
  monthlyBudget?: number;
  cycleCount?: number;
  cycleWeights?: number[];
  schedule?: PlanSchedule;
  notificationChannels?: NotificationChannel[];
  email?: string;
  telegramChatId?: string | null;
  isActive?: boolean;
}
