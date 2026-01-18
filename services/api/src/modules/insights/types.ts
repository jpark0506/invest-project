/**
 * Insights module types
 */

export interface PortfolioBuilderRequest {
  investmentStyle: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  investmentPeriod: '3M' | '6M' | '1Y';
  investmentAmount: number;
  interestedMarkets: ('KR' | 'US' | 'CRYPTO' | 'ETF')[];
}

export interface RiskSimulationRequest {
  currentPortfolioValue: number;
  holdings: {
    ticker: string;
    value: number;
    weight: number;
  }[];
}

export interface ExitGuideRequest {
  ticker: string;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  investmentStyle: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
}

export interface RebalancingRequest {
  targetAllocations: {
    assetClass: string;
    targetWeight: number;
  }[];
  currentHoldings: {
    ticker: string;
    assetClass: string;
    value: number;
    weight: number;
  }[];
  totalValue: number;
}
