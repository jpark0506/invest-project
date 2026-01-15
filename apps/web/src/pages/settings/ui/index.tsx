import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout, Card } from '@/shared/ui';

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PieChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

interface SettingsItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
}

function SettingsItem({ to, icon: Icon, label, description }: SettingsItemProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary">{label}</div>
        {description && (
          <div className="text-sm text-text-secondary truncate">{description}</div>
        )}
      </div>
      <ChevronRightIcon className="w-5 h-5 text-text-tertiary" />
    </Link>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();

  const settingsItems: SettingsItemProps[] = [
    {
      to: '/settings/portfolio',
      icon: PieChartIcon,
      label: t('settings.portfolio.title'),
      description: t('settings.portfolio.description'),
    },
    {
      to: '/settings/plan',
      icon: CalendarIcon,
      label: t('settings.plan.title'),
      description: t('settings.plan.description'),
    },
    {
      to: '/settings/account',
      icon: UserIcon,
      label: t('settings.account.title'),
      description: t('settings.account.description'),
    },
  ];

  return (
    <Layout>
      <h2 className="text-xl font-bold text-text-primary mb-6">
        {t('settings.title')}
      </h2>

      <Card padding="none">
        <div className="divide-y divide-border-light">
          {settingsItems.map((item) => (
            <SettingsItem key={item.to} {...item} />
          ))}
        </div>
      </Card>
    </Layout>
  );
}
