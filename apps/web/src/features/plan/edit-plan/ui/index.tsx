import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Input, Button } from '@/shared/ui';
import { usePlanForm } from '../model';
import type { Plan, UpdatePlanInput } from '@invest-assist/core';

interface EditPlanFormProps {
  plan: Plan | null;
  isLoading: boolean;
  onSubmit: (data: UpdatePlanInput & { email?: string }) => void;
  isPending: boolean;
}

export function EditPlanForm({ plan, isLoading, onSubmit, isPending }: EditPlanFormProps) {
  const { t } = useTranslation();
  const {
    formData,
    updateField,
    updateCycleCount,
    updateCycleWeight,
    reset,
    totalWeight,
    isValid,
    toUpdateInput,
  } = usePlanForm(plan);

  useEffect(() => {
    if (plan) {
      reset(plan);
    }
  }, [plan, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(toUpdateInput());
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <div className="space-y-6">
          {/* Monthly Budget */}
          <Input
            label={t('settings.plan.monthlyBudget')}
            type="number"
            value={formData.monthlyBudget}
            onChange={(e) =>
              updateField('monthlyBudget', parseInt(e.target.value, 10) || 0)
            }
            min={100000}
            step={100000}
          />

          {/* Cycle Count */}
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-2">
              {t('settings.plan.cycleCount')}
            </label>
            <div className="flex gap-3">
              {[2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => updateCycleCount(count)}
                  className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
                    formData.cycleCount === count
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-gray-100'
                  }`}
                >
                  {count}회
                </button>
              ))}
            </div>
          </div>

          {/* Cycle Weights */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-text-secondary text-xs font-medium">
                {t('settings.plan.cycleWeights')}
              </label>
              <span
                className={`text-xs font-semibold ${
                  Math.abs(totalWeight - 100) < 0.01
                    ? 'text-success'
                    : 'text-error'
                }`}
              >
                합계: {totalWeight.toFixed(0)}%
              </span>
            </div>
            <div className="flex gap-3">
              {formData.cycleWeights.map((weight, index) => (
                <div key={index} className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) =>
                        updateCycleWeight(
                          index,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="input text-center pr-8"
                      min={0}
                      max={100}
                      step={5}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                      %
                    </span>
                  </div>
                  <p className="text-center text-xs text-text-secondary mt-1">
                    {index + 1}차
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Days */}
          <Input
            label={t('settings.plan.scheduleDays')}
            value={formData.scheduleDays}
            onChange={(e) => updateField('scheduleDays', e.target.value)}
            placeholder="5, 19"
          />

          {/* Email */}
          <Input
            label={t('settings.plan.email')}
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="your@email.com"
          />

          <Button type="submit" fullWidth disabled={!isValid || isPending}>
            {isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </Card>
    </form>
  );
}
