import { useState, useCallback, useMemo } from 'react';
import type { Plan, PlanSchedule } from '@invest-assist/core';

export interface PlanFormData {
  monthlyBudget: number;
  cycleCount: number;
  cycleWeights: number[];
  scheduleDays: string;
  email: string;
}

export function usePlanForm(plan: Plan | null) {
  const [formData, setFormData] = useState<PlanFormData>(() => ({
    monthlyBudget: plan?.monthlyBudget || 1000000,
    cycleCount: plan?.cycleCount || 2,
    cycleWeights: plan?.cycleWeights?.map((w) => w * 100) || [50, 50],
    scheduleDays: plan?.schedule?.days?.join(', ') || '5, 19',
    email: plan?.email || '',
  }));

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
    }));
  }, []);

  const updateCycleWeight = useCallback((index: number, value: number) => {
    setFormData((prev) => {
      const newWeights = [...prev.cycleWeights];
      newWeights[index] = value;
      return { ...prev, cycleWeights: newWeights };
    });
  }, []);

  const reset = useCallback((newPlan: Plan | null) => {
    setFormData({
      monthlyBudget: newPlan?.monthlyBudget || 1000000,
      cycleCount: newPlan?.cycleCount || 2,
      cycleWeights: newPlan?.cycleWeights?.map((w) => w * 100) || [50, 50],
      scheduleDays: newPlan?.schedule?.days?.join(', ') || '5, 19',
      email: newPlan?.email || '',
    });
  }, []);

  const totalWeight = useMemo(
    () => formData.cycleWeights.reduce((sum, w) => sum + w, 0),
    [formData.cycleWeights]
  );

  const parsedDays = useMemo(() => {
    return formData.scheduleDays
      .split(',')
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d) && d >= 1 && d <= 28);
  }, [formData.scheduleDays]);

  const isValid = useMemo(() => {
    return (
      formData.monthlyBudget > 0 &&
      formData.cycleCount >= 2 &&
      formData.cycleCount <= 3 &&
      Math.abs(totalWeight - 100) < 0.01 &&
      parsedDays.length === formData.cycleCount &&
      formData.email.includes('@')
    );
  }, [formData, totalWeight, parsedDays]);

  const toUpdateInput = () => ({
    monthlyBudget: formData.monthlyBudget,
    cycleCount: formData.cycleCount,
    cycleWeights: formData.cycleWeights.map((w) => w / 100),
    schedule: {
      type: 'MONTHLY_DAYS' as const,
      days: parsedDays,
      timezone: 'Asia/Seoul',
    } satisfies PlanSchedule,
    email: formData.email,
  });

  return {
    formData,
    updateField,
    updateCycleCount,
    updateCycleWeight,
    reset,
    totalWeight,
    parsedDays,
    isValid,
    toUpdateInput,
  };
}
