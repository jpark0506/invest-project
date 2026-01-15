import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { Execution, ExecutionItemRecord } from '@invest-assist/core';
import { BottomSheet, toast, Button, Card } from '@/shared/ui';
import { useTriggerScheduler } from '../model';

interface SchedulerTriggerSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SchedulerTriggerSheet({ isOpen, onClose }: SchedulerTriggerSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dryRun, setDryRun] = useState(true);
  const [previewExecution, setPreviewExecution] = useState<Execution | null>(null);

  const triggerScheduler = useTriggerScheduler();

  const handleTrigger = () => {
    triggerScheduler.mutate(
      { dryRun },
      {
        onSuccess: (response) => {
          if (response.ok && response.execution) {
            if (dryRun) {
              setPreviewExecution(response.execution);
            } else {
              toast.success(response.message);
              queryClient.invalidateQueries({ queryKey: ['executions'] });
              onClose();
            }
          } else {
            toast.error(response.message);
          }
        },
        onError: (error) => {
          toast.error(error.message || t('common.error'));
        },
      }
    );
  };

  const handleSaveAndSend = () => {
    triggerScheduler.mutate(
      { dryRun: false },
      {
        onSuccess: (response) => {
          if (response.ok) {
            toast.success(response.message);
            queryClient.invalidateQueries({ queryKey: ['executions'] });
            setPreviewExecution(null);
            onClose();
          } else {
            toast.error(response.message);
          }
        },
        onError: (error) => {
          toast.error(error.message || t('common.error'));
        },
      }
    );
  };

  const handleClose = () => {
    setPreviewExecution(null);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={t('settings.scheduler.title')}>
      {!previewExecution ? (
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm text-text-secondary">
            {t('settings.scheduler.description')}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="dryRun" className="text-sm text-text-secondary">
              {t('settings.scheduler.dryRun')}
            </label>
          </div>
          <Button
            fullWidth
            loading={triggerScheduler.isPending}
            onClick={handleTrigger}
          >
            {t('settings.scheduler.trigger')}
          </Button>
        </div>
      ) : (
        <div className="px-5 pb-5">
          {/* Summary */}
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-text-secondary text-sm">
                {t('execution.cycleBudget')}
              </span>
              <span className="text-text-primary font-semibold">
                {previewExecution.cycleBudget.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">
                {previewExecution.yearMonth} {previewExecution.cycleIndex}차
              </span>
              <span className="text-xs text-text-tertiary">
                {previewExecution.asOfDate.split('T')[0]}
              </span>
            </div>
          </Card>

          {/* Order Table */}
          <Card padding="sm" className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary text-xs border-b border-border">
                  <th className="text-left py-3 px-2">{t('execution.table.ticker')}</th>
                  <th className="text-right py-3 px-2">{t('execution.table.price')}</th>
                  <th className="text-right py-3 px-2">{t('execution.table.shares')}</th>
                  <th className="text-right py-3 px-2">{t('execution.table.estCost')}</th>
                </tr>
              </thead>
              <tbody>
                {previewExecution.items.map((item: ExecutionItemRecord) => (
                  <tr key={item.ticker} className="border-b border-border-light">
                    <td className="py-3 px-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-text-tertiary">{item.ticker}</div>
                    </td>
                    <td className="text-right py-3 px-2">
                      {item.price.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 font-medium">{item.shares}</td>
                    <td className="text-right py-3 px-2">
                      {item.estCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-background">
                  <td colSpan={3} className="py-3 px-2 font-medium">
                    {t('execution.totalEstCost')}
                  </td>
                  <td className="text-right py-3 px-2 font-semibold">
                    {previewExecution.items.reduce((sum, item) => sum + item.estCost, 0).toLocaleString()}원
                  </td>
                </tr>
                <tr className="bg-background">
                  <td colSpan={3} className="py-3 px-2 text-text-secondary">
                    {t('execution.totalCarryOut')}
                  </td>
                  <td className="text-right py-3 px-2 text-text-secondary">
                    {previewExecution.items.reduce((sum, item) => sum + item.carryOut, 0).toLocaleString()}원
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setPreviewExecution(null)}
            >
              {t('settings.scheduler.close')}
            </Button>
            <Button
              fullWidth
              loading={triggerScheduler.isPending}
              onClick={handleSaveAndSend}
            >
              {t('settings.scheduler.saveAndSend')}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
