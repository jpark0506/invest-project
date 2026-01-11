import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout, Card, Button } from '@/shared/ui';

// Placeholder data - will be replaced with API call
const mockExecution = {
  ymCycle: '2026-01#1',
  yearMonth: '2026-01',
  cycleIndex: 1,
  asOfDate: '2026-01-05T09:00:00+09:00',
  cycleBudget: 500000,
  signals: { label: 'NEUTRAL', overheatScore: 50 },
  status: 'SENT',
  items: [
    {
      ticker: '069500',
      name: 'KODEX 200',
      price: 35000,
      targetWeight: 0.5,
      shares: 7,
      estCost: 245000,
      carryOut: 5000,
    },
    {
      ticker: '379800',
      name: 'KODEX 미국 S&P500 TR',
      price: 15000,
      targetWeight: 0.3,
      shares: 10,
      estCost: 150000,
      carryOut: 0,
    },
    {
      ticker: '439870',
      name: 'TIGER 미국나스닥100',
      price: 12000,
      targetWeight: 0.2,
      shares: 8,
      estCost: 96000,
      carryOut: 4000,
    },
  ],
  userConfirm: { confirmedAt: null, note: null },
};

export function ExecutionPage() {
  const { ymCycle } = useParams<{ ymCycle: string }>();
  const { t } = useTranslation();

  const execution = mockExecution; // Will be replaced with API call

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

  const totalEstCost = execution.items.reduce((sum, item) => sum + item.estCost, 0);
  const totalCarryOut = execution.items.reduce((sum, item) => sum + item.carryOut, 0);

  const handleConfirm = () => {
    // TODO: Implement confirm API call
    alert('주문 완료 확인');
  };

  return (
    <Layout>
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
            {execution.items.map((item) => (
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

      {/* Confirm Button */}
      {execution.status !== 'CONFIRMED' ? (
        <Button fullWidth onClick={handleConfirm}>
          {t('execution.confirm')}
        </Button>
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
        </div>
      )}
    </Layout>
  );
}
