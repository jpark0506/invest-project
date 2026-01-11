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
  userEmail?: string;
}

export function EditPlanForm({ plan, isLoading, onSubmit, isPending, userEmail }: EditPlanFormProps) {
  const { t } = useTranslation();
  const {
    formData,
    updateField,
    updateCycleCount,
    updateCycleWeight,
    updateScheduleDay,
    reset,
    totalWeight,
    isValid,
    toUpdateInput,
  } = usePlanForm(plan, userEmail);

  useEffect(() => {
    if (plan) {
      reset(plan, userEmail);
    }
  }, [plan, reset, userEmail]);

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

          {/* Schedule Days - Calendar Style */}
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-2">
              {t('settings.plan.scheduleDays')}
            </label>
            <div className="space-y-3">
              {formData.scheduleDays.map((day, index) => (
                <div key={index} className="bg-background rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-text-primary">
                      {index + 1}차 매수일
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {day}일
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateScheduleDay(index, d)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                          day === d
                            ? 'bg-primary text-white'
                            : 'bg-surface text-text-secondary hover:bg-gray-100'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
