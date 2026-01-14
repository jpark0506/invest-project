import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { userApi, type InvestmentStyle } from '@/entities/user/api';
import { useUserStore } from '@/entities/user/model';
import { toast, Checkbox, Button } from '@/shared/ui';

type Step = 'privacy' | 'marketing' | 'profile';

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);

  const [currentStep, setCurrentStep] = useState<Step>('privacy');
  const [displayedStep, setDisplayedStep] = useState<Step>('privacy');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [investmentStyle, setInvestmentStyle] = useState<InvestmentStyle | undefined>();

  // Handle step transition animation
  useEffect(() => {
    if (currentStep !== displayedStep) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedStep(currentStep);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStep, displayedStep]);

  const completeOnboarding = useMutation({
    mutationFn: userApi.completeOnboarding,
    onSuccess: (data) => {
      setUser(data.user);
      toast.success(t('onboarding.complete'));
      navigate('/dashboard');
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleNext = () => {
    if (currentStep === 'privacy') {
      setCurrentStep('marketing');
    } else if (currentStep === 'marketing') {
      setCurrentStep('profile');
    }
  };

  const handleSubmit = () => {
    completeOnboarding.mutate({
      consents: {
        privacy: privacyConsent,
        marketing: marketingConsent,
      },
      profile: investmentStyle ? { investmentStyle } : undefined,
    });
  };

  const handleSkip = () => {
    completeOnboarding.mutate({
      consents: {
        privacy: privacyConsent,
        marketing: marketingConsent,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {t('onboarding.title')}
          </h1>
          <p className="text-text-secondary">{t('onboarding.subtitle')}</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {(['privacy', 'marketing', 'profile'] as Step[]).map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full ${
                currentStep === step
                  ? 'bg-primary'
                  : index < ['privacy', 'marketing', 'profile'].indexOf(currentStep)
                    ? 'bg-primary/50'
                    : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="card p-6">
          <div
            className="transition-all duration-150 ease-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateX(-8px)' : 'translateX(0)',
            }}
          >
          {displayedStep === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  {t('onboarding.privacy.title')}
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  {t('onboarding.privacy.description')}
                </p>
              </div>

              <Checkbox
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                label={t('onboarding.privacy.consent')}
              />

              <Button
                fullWidth
                onClick={handleNext}
                disabled={!privacyConsent}
              >
                {t('common.confirm')}
              </Button>
            </div>
          )}

          {displayedStep === 'marketing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  {t('onboarding.marketing.title')}
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  {t('onboarding.marketing.description')}
                </p>
              </div>

              <Checkbox
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                label={t('onboarding.marketing.consent')}
              />

              <Button fullWidth onClick={handleNext}>
                {t('common.confirm')}
              </Button>
            </div>
          )}

          {displayedStep === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  {t('onboarding.profile.title')}
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  {t('onboarding.profile.description')}
                </p>
              </div>

              <div className="space-y-3">
                {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as InvestmentStyle[]).map(
                  (style) => (
                    <button
                      key={style}
                      onClick={() => setInvestmentStyle(style)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-colors ${
                        investmentStyle === style
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-text-primary">
                        {t(`onboarding.profile.styles.${style}.title`)}
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        {t(`onboarding.profile.styles.${style}.description`)}
                      </div>
                    </button>
                  )
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleSkip}
                  loading={completeOnboarding.isPending}
                  className="flex-1"
                >
                  {t('common.skip')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!investmentStyle}
                  loading={completeOnboarding.isPending}
                  className="flex-1"
                >
                  {t('common.confirm')}
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
