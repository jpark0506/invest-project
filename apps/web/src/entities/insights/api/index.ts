import { apiClient } from '@/shared/api';

// Types
export interface PortfolioBuilderRequest {
  investmentStyle: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  investmentPeriod: '3M' | '6M' | '1Y';
  investmentAmount: number;
  interestedMarkets: ('KR' | 'US' | 'CRYPTO' | 'ETF')[];
}

export interface PortfolioRecommendation {
  allocations: {
    assetClass: string;
    weight: number;
    description: string;
    suggestedTickers?: string[];
  }[];
  rationale: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedReturn: {
    min: number;
    max: number;
  };
}

export interface RiskSimulationRequest {
  currentPortfolioValue: number;
  holdings: {
    ticker: string;
    value: number;
    weight: number;
  }[];
}

export interface RiskSimulationResult {
  scenarios: {
    name: string;
    description: string;
    percentChange: number;
    resultingValue: number;
    breakdown: {
      ticker: string;
      originalValue: number;
      newValue: number;
      change: number;
    }[];
  }[];
  riskAssessment: string;
  recommendations: string[];
}

export interface ExitGuideRequest {
  ticker: string;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  investmentStyle: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
}

export interface ExitGuideResult {
  takeProfitLevels: {
    level: number;
    price: number;
    percentGain: number;
    suggestedAction: string;
    potentialProfit: number;
  }[];
  stopLossLevels: {
    level: number;
    price: number;
    percentLoss: number;
    suggestedAction: string;
    potentialLoss: number;
  }[];
  currentStatus: {
    unrealizedPnL: number;
    percentChange: number;
    recommendation: string;
  };
  strategy: string;
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

export interface RebalancingResult {
  actions: {
    ticker: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    amount: number;
    reason: string;
  }[];
  summary: {
    totalBuyAmount: number;
    totalSellAmount: number;
    netCashFlow: number;
  };
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

// API
export const insightsApi = {
  generatePortfolio: (request: PortfolioBuilderRequest) =>
    apiClient.post<{ recommendation: PortfolioRecommendation }>('/insights/portfolio-builder', request),

  simulateRisk: (request: RiskSimulationRequest) =>
    apiClient.post<{ simulation: RiskSimulationResult }>('/insights/risk-simulation', request),

  generateExitGuide: (request: ExitGuideRequest) =>
    apiClient.post<{ guide: ExitGuideResult }>('/insights/exit-guide', request),

  getRebalancingAdvice: (request: RebalancingRequest) =>
    apiClient.post<{ advice: RebalancingResult }>('/insights/rebalancing', request),
};
