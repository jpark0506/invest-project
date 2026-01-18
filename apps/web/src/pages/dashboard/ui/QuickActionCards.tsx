import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface QuickAction {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const actions: QuickAction[] = [
  {
    id: 'builder',
    titleKey: 'insights.portfolioBuilder.title',
    descriptionKey: 'insights.portfolioBuilder.description',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    path: '/insights/builder',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'risk',
    titleKey: 'insights.riskSimulator.title',
    descriptionKey: 'insights.riskSimulator.description',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    path: '/insights/risk',
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 'exit',
    titleKey: 'insights.exitGuide.title',
    descriptionKey: 'insights.exitGuide.description',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    path: '/insights/exit-guide',
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'rebalance',
    titleKey: 'insights.rebalancing.title',
    descriptionKey: 'insights.rebalancing.description',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    path: '/insights/rebalancing',
    color: 'from-purple-500 to-purple-600',
  },
];

export function QuickActionCards() {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">
        {t('insights.quickActions.title')}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.path}
            className="flex-shrink-0 w-32"
          >
            <div className={`bg-gradient-to-br ${action.color} rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-shadow`}>
              <div className="mb-2">{action.icon}</div>
              <p className="text-xs font-semibold leading-tight">
                {t(action.titleKey)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
