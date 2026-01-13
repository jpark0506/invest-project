import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Layout, Card, Button, SectionLoader, ErrorFallback, Modal } from '@/shared/ui';
import { useExecutions } from '@/entities/execution/model';

interface StatsData {
  totalBudget: number;
  confirmedCount: number;
  pendingCount: number;
  monthlyStats: { month: string; budget: number; count: number }[];
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useExecutions();
  const [showReport, setShowReport] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-success';
      case 'SENT':
        return 'text-primary';
      default:
        return 'text-text-secondary';
    }
  };

  const getSignalColor = (label: string) => {
    switch (label) {
      case 'OVERHEAT':
        return 'bg-error/10 text-error';
      case 'COOL':
        return 'bg-success/10 text-success';
      default:
        return 'bg-text-secondary/10 text-text-secondary';
    }
  };

  const executions = data?.executions ?? [];

  // Calculate statistics
  const stats: StatsData = useMemo(() => {
    const confirmed = executions.filter((e) => e.status === 'CONFIRMED');
    const pending = executions.filter((e) => e.status !== 'CONFIRMED');

    // Group by month
    const monthlyMap = new Map<string, { budget: number; count: number }>();
    executions.forEach((e) => {
      const existing = monthlyMap.get(e.yearMonth) || { budget: 0, count: 0 };
      monthlyMap.set(e.yearMonth, {
        budget: existing.budget + (e.status === 'CONFIRMED' ? e.cycleBudget : 0),
        count: existing.count + 1,
      });
    });

    const monthlyStats = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      totalBudget: confirmed.reduce((sum, e) => sum + e.cycleBudget, 0),
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      monthlyStats,
    };
  }, [executions]);

  if (isLoading) {
    return (
      <Layout>
        <SectionLoader className="py-12" />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorFallback message={t('common.error')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">
          {t('dashboard.title')}
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowReport(true)}
        >
          {t('dashboard.viewReport')}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center">
          <p className="text-xs text-text-secondary mb-1">{t('dashboard.stats.totalInvested')}</p>
          <p className="text-lg font-bold text-primary">
            {stats.totalBudget.toLocaleString()}원
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-text-secondary mb-1">{t('dashboard.stats.executions')}</p>
          <p className="text-lg font-bold text-text-primary">
            {stats.confirmedCount}<span className="text-sm text-text-secondary">/{executions.length}</span>
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        {executions.map((execution) => (
          <Link key={execution.ymCycle} to={`/execution/${encodeURIComponent(execution.ymCycle)}`}>
            <Card className="hover:shadow-elevated transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">
                    {execution.yearMonth}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {t('dashboard.cycle', { index: execution.cycleIndex })}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getSignalColor(execution.signals.label)}`}
                >
                  {t(`execution.signalLabels.${execution.signals.label}`)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-text-secondary text-sm">
                  {t('dashboard.budget')}:{' '}
                  <span className="text-text-primary font-medium">
                    {execution.cycleBudget.toLocaleString()}원
                  </span>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(execution.status)}`}>
                  {t(`dashboard.status.${execution.status}`)}
                </span>
              </div>
            </Card>
          </Link>
        ))}

        {executions.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-text-secondary">{t('dashboard.noExecutions')}</p>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        title={t('dashboard.report.title')}
      >
        <div className="p-4 space-y-6">
          {/* Summary */}
          <section>
            <h4 className="text-sm font-semibold text-text-secondary mb-3">
              {t('dashboard.report.summary')}
            </h4>
            <div className="bg-background rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">{t('dashboard.stats.totalInvested')}</span>
                <span className="font-bold text-primary">{stats.totalBudget.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{t('dashboard.report.confirmed')}</span>
                <span className="font-medium">{stats.confirmedCount}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{t('dashboard.report.pending')}</span>
                <span className="font-medium">{stats.pendingCount}회</span>
              </div>
            </div>
          </section>

          {/* Monthly Breakdown */}
          <section>
            <h4 className="text-sm font-semibold text-text-secondary mb-3">
              {t('dashboard.report.monthly')}
            </h4>
            <div className="space-y-2">
              {stats.monthlyStats.length > 0 ? (
                stats.monthlyStats.map(({ month, budget, count }) => (
                  <div key={month} className="bg-background rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{month}</p>
                      <p className="text-xs text-text-secondary">{count}회 실행</p>
                    </div>
                    <p className="font-bold text-primary">{budget.toLocaleString()}원</p>
                  </div>
                ))
              ) : (
                <p className="text-text-secondary text-center py-4">
                  {t('dashboard.noExecutions')}
                </p>
              )}
            </div>
          </section>
        </div>
      </Modal>
    </Layout>
  );
}
