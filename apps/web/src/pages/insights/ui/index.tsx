import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Layout, Card } from '@/shared/ui';

const insightFeatures = [
  {
    id: 'builder',
    titleKey: 'insights.portfolioBuilder.title',
    descriptionKey: 'insights.portfolioBuilder.description',
    path: '/insights/builder',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'risk',
    titleKey: 'insights.riskSimulator.title',
    descriptionKey: 'insights.riskSimulator.description',
    path: '/insights/risk',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    id: 'exit',
    titleKey: 'insights.exitGuide.title',
    descriptionKey: 'insights.exitGuide.description',
    path: '/insights/exit-guide',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    gradient: 'from-green-500 to-green-600',
  },
  {
    id: 'rebalancing',
    titleKey: 'insights.rebalancing.title',
    descriptionKey: 'insights.rebalancing.description',
    path: '/insights/rebalancing',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    gradient: 'from-purple-500 to-purple-600',
  },
];

export function InsightsPage() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          {t('insights.title')}
        </h1>
        <p className="text-sm text-text-secondary">
          {t('insights.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        {insightFeatures.map((feature) => (
          <Link key={feature.id} to={feature.path}>
            <Card className="hover:shadow-elevated transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white`}>
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary mb-1">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {t(feature.descriptionKey)}
                  </p>
                </div>
                <svg className="w-5 h-5 text-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
