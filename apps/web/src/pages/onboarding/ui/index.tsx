import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { userApi, type InvestmentStyle, type InvestmentPeriod, type InterestedMarket } from '@/entities/user/api';
import { useUserStore } from '@/entities/user/model';
import { toast, Checkbox, Button } from '@/shared/ui';

type Step = 'privacy' | 'marketing' | 'profile' | 'period' | 'amount' | 'markets';

const STEPS: Step[] = ['privacy', 'marketing', 'profile', 'period', 'amount', 'markets'];

const AMOUNT_PRESETS = [
  { key: '1m', value: 1000000 },
  { key: '5m', value: 5000000 },
  { key: '10m', value: 10000000 },
] as const;

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);

  const [currentStep, setCurrentStep] = useState<Step>('privacy');
  const [displayedStep, setDisplayedStep] = useState<Step>('privacy');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Form state
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [investmentStyle, setInvestmentStyle] = useState<InvestmentStyle | undefined>();
  const [investmentPeriod, setInvestmentPeriod] = useState<InvestmentPeriod | undefined>();
  const [investmentAmount, setInvestmentAmount] = useState<number | undefined>();
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [interestedMarkets, setInterestedMarkets] = useState<InterestedMarket[]>([]);

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

  const getCurrentStepIndex = () => STEPS.indexOf(currentStep);

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleSubmit = () => {
    completeOnboarding.mutate({
      consents: {
        privacy: privacyConsent,
        marketing: marketingConsent,
      },
      profile: {
        ...(investmentStyle && { investmentStyle }),
        ...(investmentPeriod && { investmentPeriod }),
        ...(investmentAmount && { investmentAmount }),
        ...(interestedMarkets.length > 0 && { interestedMarkets }),
      },
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

  const handleAmountPreset = (value: number) => {
    setInvestmentAmount(value);
    setShowCustomInput(false);
    setCustomAmountInput('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountInput(value);
    if (value) {
      setInvestmentAmount(parseInt(value, 10));
    } else {
      setInvestmentAmount(undefined);
    }
  };

  const toggleMarket = (market: InterestedMarket) => {
    setInterestedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
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
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentStep === step
                  ? 'bg-primary'
                  : index < getCurrentStepIndex()
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
            {/* Step 1: Privacy */}
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

            {/* Step 2: Marketing */}
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

            {/* Step 3: Investment Style */}
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
                    onClick={handleNext}
                    disabled={!investmentStyle}
                    className="flex-1"
                  >
                    {t('common.confirm')}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Investment Period */}
            {displayedStep === 'period' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    {t('onboarding.period.title')}
                  </h2>
                  <p className="text-sm text-text-secondary mb-4">
                    {t('onboarding.period.description')}
                  </p>
                </div>

                <div className="space-y-3">
                  {(['3M', '6M', '1Y'] as InvestmentPeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setInvestmentPeriod(period)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-colors ${
                        investmentPeriod === period
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-text-primary">
                        {t(`onboarding.period.options.${period}.title`)}
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        {t(`onboarding.period.options.${period}.description`)}
                      </div>
                    </button>
                  ))}
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
                    onClick={handleNext}
                    disabled={!investmentPeriod}
                    className="flex-1"
                  >
                    {t('common.confirm')}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Investment Amount */}
            {displayedStep === 'amount' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    {t('onboarding.amount.title')}
                  </h2>
                  <p className="text-sm text-text-secondary mb-4">
                    {t('onboarding.amount.description')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {AMOUNT_PRESETS.map(({ key, value }) => (
                    <button
                      key={key}
                      onClick={() => handleAmountPreset(value)}
                      className={`p-3 text-center rounded-xl border-2 transition-colors ${
                        investmentAmount === value && !showCustomInput
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-text-primary">
                        {t(`onboarding.amount.presets.${key}`)}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowCustomInput(true);
                      setInvestmentAmount(undefined);
                    }}
                    className={`p-3 text-center rounded-xl border-2 transition-colors ${
                      showCustomInput
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-text-primary">
                      {t('onboarding.amount.presets.custom')}
                    </div>
                  </button>
                </div>

                {showCustomInput && (
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customAmountInput ? formatCurrency(parseInt(customAmountInput, 10)) : ''}
                      onChange={handleCustomAmountChange}
                      placeholder={t('onboarding.amount.placeholder')}
                      className="w-full p-4 pr-12 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-text-primary"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                      원
                    </span>
                  </div>
                )}

                {investmentAmount && (
                  <div className="text-center text-primary font-semibold">
                    {formatCurrency(investmentAmount)}원
                  </div>
                )}

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
                    onClick={handleNext}
                    disabled={!investmentAmount}
                    className="flex-1"
                  >
                    {t('common.confirm')}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Markets of Interest */}
            {displayedStep === 'markets' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    {t('onboarding.markets.title')}
                  </h2>
                  <p className="text-sm text-text-secondary mb-4">
                    {t('onboarding.markets.description')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(['KR', 'US', 'CRYPTO', 'ETF'] as InterestedMarket[]).map((market) => (
                    <button
                      key={market}
                      onClick={() => toggleMarket(market)}
                      className={`p-4 text-left rounded-xl border-2 transition-colors ${
                        interestedMarkets.includes(market)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-text-primary">
                        {t(`onboarding.markets.options.${market}.title`)}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {t(`onboarding.markets.options.${market}.description`)}
                      </div>
                    </button>
                  ))}
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
                    disabled={interestedMarkets.length === 0}
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
