/**
 * AI Provider abstraction types
 */

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  name: string;
  generateText(prompt: string, options?: AIOptions): Promise<string>;
  generateJSON<T>(prompt: string, options?: AIOptions): Promise<T>;
}

export interface PortfolioBuilderInput {
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

export interface RiskSimulationInput {
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

export interface ExitGuideInput {
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

export interface RebalancingInput {
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
