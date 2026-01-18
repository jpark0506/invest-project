/**
 * Insights service - AI-powered investment insights
 */

import { getAIClient, type PortfolioRecommendation, type RiskSimulationResult, type ExitGuideResult, type RebalancingResult } from '../../shared/ai';
import type { PortfolioBuilderRequest, RiskSimulationRequest, ExitGuideRequest, RebalancingRequest } from './types';

export async function generatePortfolioRecommendation(
  request: PortfolioBuilderRequest
): Promise<PortfolioRecommendation> {
  const ai = await getAIClient();

  const prompt = `You are a professional investment advisor. Generate a portfolio allocation recommendation based on the following investor profile:

Investment Style: ${request.investmentStyle}
- CONSERVATIVE: Prioritizes capital preservation, prefers low-risk assets
- BALANCED: Seeks balance between growth and stability
- AGGRESSIVE: Willing to take higher risks for potentially higher returns

Investment Period: ${request.investmentPeriod}
- 3M: Short-term (3 months)
- 6M: Mid-term (6 months)
- 1Y: Long-term (1 year)

Investment Amount: ${request.investmentAmount.toLocaleString()} KRW

Interested Markets: ${request.interestedMarkets.join(', ')}
- KR: Korean stocks (KOSPI, KOSDAQ)
- US: US stocks (S&P 500, NASDAQ)
- CRYPTO: Cryptocurrency (Bitcoin, Ethereum, etc.)
- ETF: Domestic and international ETFs

Provide a JSON response with the following structure:
{
  "allocations": [
    {
      "assetClass": "Asset class name (e.g., Korean Large Cap, US Tech, Bitcoin, Bond ETF)",
      "weight": 0.0 to 1.0 (total must equal 1.0),
      "description": "Brief description of why this allocation",
      "suggestedTickers": ["TICKER1", "TICKER2"] (optional, 1-3 examples)
    }
  ],
  "rationale": "Overall investment rationale explaining the strategy",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "expectedReturn": {
    "min": minimum expected annual return as decimal (e.g., 0.03 for 3%),
    "max": maximum expected annual return as decimal (e.g., 0.08 for 8%)
  }
}`;

  return ai.generateJSON<PortfolioRecommendation>(prompt);
}

export async function simulateRisk(
  request: RiskSimulationRequest
): Promise<RiskSimulationResult> {
  const ai = await getAIClient();

  const holdingsDescription = request.holdings
    .map(h => `${h.ticker}: ${h.value.toLocaleString()} KRW (${(h.weight * 100).toFixed(1)}%)`)
    .join('\n');

  const prompt = `You are a risk analysis expert. Analyze the following portfolio and simulate various market scenarios:

Current Portfolio Value: ${request.currentPortfolioValue.toLocaleString()} KRW

Holdings:
${holdingsDescription}

Generate risk simulation results with at least 4 scenarios:
1. Market Crash (-30% overall market decline)
2. Bear Market (-15% decline)
3. Bull Market (+20% growth)
4. Strong Rally (+50% growth)

For each scenario, calculate how each holding would be affected based on its characteristics (volatility, sector, asset type).

Provide a JSON response:
{
  "scenarios": [
    {
      "name": "Scenario name",
      "description": "Brief description of the scenario",
      "percentChange": -0.30 for -30% (use decimals),
      "resultingValue": calculated portfolio value after scenario,
      "breakdown": [
        {
          "ticker": "TICKER",
          "originalValue": original value,
          "newValue": value after scenario,
          "change": absolute change in value
        }
      ]
    }
  ],
  "riskAssessment": "Overall risk assessment of the portfolio",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}`;

  return ai.generateJSON<RiskSimulationResult>(prompt);
}

export async function generateExitGuide(
  request: ExitGuideRequest
): Promise<ExitGuideResult> {
  const ai = await getAIClient();

  const totalValue = request.currentPrice * request.quantity;
  const totalCost = request.purchasePrice * request.quantity;
  const currentPnL = totalValue - totalCost;
  const currentPnLPercent = (currentPnL / totalCost) * 100;

  const prompt = `You are an expert trading advisor. Generate take-profit and stop-loss recommendations for the following position:

Ticker: ${request.ticker}
Purchase Price: ${request.purchasePrice.toLocaleString()} KRW
Current Price: ${request.currentPrice.toLocaleString()} KRW
Quantity: ${request.quantity}
Total Position Value: ${totalValue.toLocaleString()} KRW
Current P&L: ${currentPnL >= 0 ? '+' : ''}${currentPnL.toLocaleString()} KRW (${currentPnLPercent >= 0 ? '+' : ''}${currentPnLPercent.toFixed(2)}%)

Investor Style: ${request.investmentStyle}
- CONSERVATIVE: Prefers smaller, more frequent profit-taking; tighter stop-losses
- BALANCED: Moderate profit targets and stop-losses
- AGGRESSIVE: Larger profit targets; willing to accept more volatility

Provide a JSON response:
{
  "takeProfitLevels": [
    {
      "level": 1 (1 = first target, 2 = second target, etc.),
      "price": target price in KRW,
      "percentGain": gain percentage from purchase price (decimal, e.g., 0.10 for 10%),
      "suggestedAction": "Sell X% of position" or specific advice,
      "potentialProfit": profit in KRW if sold at this level
    }
  ],
  "stopLossLevels": [
    {
      "level": 1 (1 = primary stop, 2 = secondary, etc.),
      "price": stop-loss price in KRW,
      "percentLoss": loss percentage from purchase price (negative decimal, e.g., -0.05 for -5%),
      "suggestedAction": "Exit position" or specific advice,
      "potentialLoss": loss in KRW if triggered
    }
  ],
  "currentStatus": {
    "unrealizedPnL": ${currentPnL},
    "percentChange": ${currentPnLPercent / 100},
    "recommendation": "Current recommendation based on the position status"
  },
  "strategy": "Overall exit strategy explanation"
}`;

  return ai.generateJSON<ExitGuideResult>(prompt);
}

export async function generateRebalancingAdvice(
  request: RebalancingRequest
): Promise<RebalancingResult> {
  const ai = await getAIClient();

  const targetDescription = request.targetAllocations
    .map(t => `${t.assetClass}: ${(t.targetWeight * 100).toFixed(1)}%`)
    .join('\n');

  const currentDescription = request.currentHoldings
    .map(h => `${h.ticker} (${h.assetClass}): ${h.value.toLocaleString()} KRW (${(h.weight * 100).toFixed(1)}%)`)
    .join('\n');

  const prompt = `You are a portfolio rebalancing expert. Analyze the current portfolio and provide rebalancing recommendations:

Total Portfolio Value: ${request.totalValue.toLocaleString()} KRW

Target Allocations:
${targetDescription}

Current Holdings:
${currentDescription}

Calculate the difference between current and target allocations, and provide specific buy/sell recommendations to rebalance the portfolio.

Provide a JSON response:
{
  "actions": [
    {
      "ticker": "TICKER or asset class if no specific ticker",
      "action": "BUY" | "SELL" | "HOLD",
      "amount": amount in KRW to buy or sell (0 for HOLD),
      "reason": "Brief explanation of why this action"
    }
  ],
  "summary": {
    "totalBuyAmount": total KRW to spend on purchases,
    "totalSellAmount": total KRW from sales,
    "netCashFlow": net cash needed (positive = need cash, negative = excess cash)
  },
  "urgency": "LOW" | "MEDIUM" | "HIGH" (based on how far off the allocations are),
  "explanation": "Overall explanation of the rebalancing strategy"
}`;

  return ai.generateJSON<RebalancingResult>(prompt);
}
