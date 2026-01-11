import { useState, useCallback, useMemo } from 'react';
import type { Plan, PlanSchedule } from '@invest-assist/core';

export interface PlanFormData {
  monthlyBudget: number;
  cycleCount: number;
  cycleWeights: number[];
  scheduleDays: number[];
  email: string;
}

// Default schedule days based on cycle count
const DEFAULT_SCHEDULE_DAYS: Record<number, number[]> = {
  2: [5, 19],
  3: [5, 14, 25],
};

export function usePlanForm(plan: Plan | null, userEmail?: string) {
  const [formData, setFormData] = useState<PlanFormData>(() => {
    const cycleCount = plan?.cycleCount || 2;
    return {
      monthlyBudget: plan?.monthlyBudget || 1000000,
      cycleCount,
      cycleWeights: plan?.cycleWeights?.map((w) => w * 100) || [50, 50],
      scheduleDays: plan?.schedule?.days || DEFAULT_SCHEDULE_DAYS[cycleCount],
      email: plan?.email || userEmail || '',
    };
  });

  const updateField = useCallback(
    <K extends keyof PlanFormData>(field: K, value: PlanFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateCycleCount = useCallback((count: number) => {
    const validCount = Math.max(2, Math.min(3, count));
    setFormData((prev) => ({
      ...prev,
      cycleCount: validCount,
      cycleWeights:
        validCount === 2 ? [50, 50] : validCount === 3 ? [40, 30, 30] : prev.cycleWeights,
      scheduleDays: DEFAULT_SCHEDULE_DAYS[validCount],
    }));
  }, []);

  const updateCycleWeight = useCallback((index: number, value: number) => {
    setFormData((prev) => {
      const newWeights = [...prev.cycleWeights];
      newWeights[index] = value;
      return { ...prev, cycleWeights: newWeights };
    });
  }, []);

  const reset = useCallback((newPlan: Plan | null, newUserEmail?: string) => {
    const cycleCount = newPlan?.cycleCount || 2;
    setFormData({
      monthlyBudget: newPlan?.monthlyBudget || 1000000,
      cycleCount,
      cycleWeights: newPlan?.cycleWeights?.map((w) => w * 100) || [50, 50],
      scheduleDays: newPlan?.schedule?.days || DEFAULT_SCHEDULE_DAYS[cycleCount],
      email: newPlan?.email || newUserEmail || '',
    });
  }, []);

  const totalWeight = useMemo(
    () => formData.cycleWeights.reduce((sum, w) => sum + w, 0),
    [formData.cycleWeights]
  );

  const updateScheduleDay = useCallback((index: number, day: number) => {
    setFormData((prev) => {
      const newDays = [...prev.scheduleDays];
      newDays[index] = day;
      return { ...prev, scheduleDays: newDays };
    });
  }, []);

  const isValid = useMemo(() => {
    const hasValidEmail = formData.email === '' || formData.email.includes('@');
    const hasValidDays = formData.scheduleDays.length === formData.cycleCount &&
      formData.scheduleDays.every((d) => d >= 1 && d <= 28);

    return (
      formData.monthlyBudget > 0 &&
      formData.cycleCount >= 2 &&
      formData.cycleCount <= 3 &&
      Math.abs(totalWeight - 100) < 0.01 &&
      hasValidDays &&
      hasValidEmail
    );
  }, [formData, totalWeight]);

  const toUpdateInput = () => ({
    monthlyBudget: formData.monthlyBudget,
    cycleCount: formData.cycleCount,
    cycleWeights: formData.cycleWeights.map((w) => w / 100),
    schedule: {
      type: 'MONTHLY_DAYS' as const,
      days: formData.scheduleDays,
      timezone: 'Asia/Seoul',
    } satisfies PlanSchedule,
    email: formData.email || undefined,
  });

  return {
    formData,
    updateField,
    updateCycleCount,
    updateCycleWeight,
    updateScheduleDay,
    reset,
    totalWeight,
    isValid,
    toUpdateInput,
  };
}
