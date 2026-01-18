import { useState, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout, Card, Button, Input, ConfirmModal, toast, SectionLoader, QueryErrorBoundary } from '@/shared/ui';
import { useExecutionDetail, useConfirmExecution, useDeleteExecution } from '@/entities/execution/model';
import type { ExecutionItemRecord } from '@invest-assist/core';

function ExecutionContent({ ymCycle }: { ymCycle: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const decodedYmCycle = decodeURIComponent(ymCycle);
  const { data } = useExecutionDetail(decodedYmCycle);
  const confirmMutation = useConfirmExecution();
  const deleteMutation = useDeleteExecution();

  const execution = data?.execution;

  const getSignalColor = (label: string) => {
    switch (label) {
      case 'OVERHEAT':
        return 'text-error';
      case 'COOL':
        return 'text-success';
      default:
        return 'text-text-secondary';
    }
  };

  const handleConfirm = async () => {
    if (!decodedYmCycle) return;

    try {
      await confirmMutation.mutateAsync({
        ymCycle: decodedYmCycle,
        data: { note: note || undefined },
      });
      setShowConfirmModal(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!decodedYmCycle) return;

    try {
      await deleteMutation.mutateAsync(decodedYmCycle);
      toast.success(t('execution.deleted'));
      navigate('/dashboard');
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (!execution) {
    return (
      <Card className="text-center py-12">
        <p className="text-error">{t('common.error')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/dashboard')}>
          {t('common.back')}
        </Button>
      </Card>
    );
  }

  const totalEstCost = execution.items.reduce((sum: number, item: ExecutionItemRecord) => sum + item.estCost, 0);
  const totalCarryOut = execution.items.reduce((sum: number, item: ExecutionItemRecord) => sum + item.carryOut, 0);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">
          {t('execution.title', {
            yearMonth: execution.yearMonth,
            index: execution.cycleIndex,
          })}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {t('execution.asOfDate')}: {execution.asOfDate.split('T')[0]}
        </p>
      </div>

      {/* Summary Card */}
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-text-secondary text-sm">
            {t('execution.cycleBudget')}
          </span>
          <span className="text-text-primary font-semibold">
            {execution.cycleBudget.toLocaleString()}원
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary text-sm">{t('execution.signal')}</span>
          <span className={`font-semibold ${getSignalColor(execution.signals.label)}`}>
            {t(`execution.signalLabels.${execution.signals.label}`)}
          </span>
        </div>
      </Card>

      {/* Signal Disclaimer */}
      <p className="text-xs text-text-tertiary mb-4 px-1">
        {t('execution.signalDisclaimer')}
      </p>

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
            {execution.items.map((item: ExecutionItemRecord) => (
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
                {totalEstCost.toLocaleString()}원
              </td>
            </tr>
            <tr className="bg-background">
              <td colSpan={3} className="py-3 px-2 text-text-secondary">
                {t('execution.totalCarryOut')}
              </td>
              <td className="text-right py-3 px-2 text-text-secondary">
                {totalCarryOut.toLocaleString()}원
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {/* Action Buttons */}
      {execution.status !== 'CONFIRMED' ? (
        <div className="space-y-3">
          <Button fullWidth onClick={() => setShowConfirmModal(true)}>
            {t('execution.confirm')}
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => setShowDeleteModal(true)}
          >
            {t('execution.delete')}
          </Button>
        </div>
      ) : (
        <div className="text-center py-4">
          <span className="inline-flex items-center gap-2 text-success font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {t('execution.confirmed')}
          </span>
          {execution.userConfirm.note && (
            <p className="text-sm text-text-secondary mt-2">{execution.userConfirm.note}</p>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <Card className="w-full max-w-lg rounded-b-none animate-slide-up">
            <h3 className="text-lg font-bold mb-4">{t('execution.confirmTitle')}</h3>
            <Input
              label={t('execution.confirmNote')}
              placeholder={t('execution.confirmNotePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowConfirmModal(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                fullWidth
                onClick={handleConfirm}
                loading={confirmMutation.isPending}
              >
                {t('common.confirm')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('execution.deleteTitle')}
        message={t('execution.deleteMessage')}
        confirmText={t('execution.deleteConfirm')}
        cancelText={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
}

export function ExecutionPage() {
  const { ymCycle } = useParams<{ ymCycle: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!ymCycle) {
    return (
      <Layout>
        <Card className="text-center py-12">
          <p className="text-error">{t('common.error')}</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/dashboard')}>
            {t('common.back')}
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <QueryErrorBoundary>
        <Suspense fallback={<SectionLoader className="py-12" />}>
          <ExecutionContent ymCycle={ymCycle} />
        </Suspense>
      </QueryErrorBoundary>
    </Layout>
  );
}
