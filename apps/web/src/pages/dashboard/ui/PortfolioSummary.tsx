import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import { useUserStore } from '@/entities/user/model';

interface PortfolioSummaryProps {
  totalInvested: number;
  confirmedCount: number;
  totalCount: number;
}

export function PortfolioSummary({ totalInvested, confirmedCount, totalCount }: PortfolioSummaryProps) {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);

  const investmentAmount = user?.profile?.investmentAmount;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text-primary">
          {user?.nickname ? `${user.nickname}님의 포트폴리오` : '나의 포트폴리오'}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-text-secondary mb-1">
            {t('dashboard.stats.totalInvested')}
          </p>
          <p className="text-xl font-bold text-primary">
            {totalInvested.toLocaleString()}원
          </p>
        </div>

        {investmentAmount && (
          <div>
            <p className="text-xs text-text-secondary mb-1">목표 투자금</p>
            <p className="text-xl font-bold text-text-primary">
              {investmentAmount.toLocaleString()}원
            </p>
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {t('dashboard.stats.executions')}
            </span>
            <span className="text-sm font-medium text-text-primary">
              {confirmedCount} / {totalCount}
            </span>
          </div>
          <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(confirmedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
