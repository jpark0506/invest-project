import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Layout, Card } from '@/shared/ui';
import { useExecutions } from '@/entities/execution/model';

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useExecutions();

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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Card className="text-center py-12">
          <p className="text-error">{t('common.error')}</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="text-xl font-bold text-text-primary mb-6">
        {t('dashboard.title')}
      </h2>

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
    </Layout>
  );
}
