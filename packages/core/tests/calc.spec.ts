/**
 * Unit tests for calculateExecution
 * Based on calc.md test cases
 */

import { describe, it, expect } from 'vitest';
import {
  calculateExecution,
  CalculateExecutionInput,
  ValidationError,
  Holding,
  ExchangeRates,
} from '../src/index';

// Default exchange rates for tests (KRW base)
const defaultExchangeRates: ExchangeRates = {
  KRW: 1,
  USD: 1350,
};

describe('calculateExecution', () => {
  // Sample holdings for tests
  const sampleHoldings: Holding[] = [
    { ticker: '069500', name: 'KODEX 200', market: 'KRX', targetWeight: 0.5 },
    { ticker: '379800', name: 'KODEX 미국 S&P500 TR', market: 'KRX', targetWeight: 0.3 },
    { ticker: '439870', name: 'TIGER 미국나스닥100', market: 'KRX', targetWeight: 0.2 },
  ];

  const samplePrices: Record<string, number> = {
    '069500': 35000,
    '379800': 15000,
    '439870': 12000,
  };

  describe('Case A: Normal calculation (sufficient prices)', () => {
    it('should calculate correct shares and carry-out', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: sampleHoldings,
        prices: samplePrices,
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      const result = calculateExecution(input);

      // Cycle budget = 1,000,000 * 0.5 = 500,000
      expect(result.cycleBudget).toBe(500000);

      // Check items
      expect(result.items).toHaveLength(3);

      // Item 1: KODEX 200
      // targetAmount = 500,000 * 0.5 = 250,000
      // shares = floor(250,000 / 35,000) = 7
      // estCost = 7 * 35,000 = 245,000
      // carryOut = 250,000 - 245,000 = 5,000
      const item1 = result.items[0];
      expect(item1.ticker).toBe('069500');
      expect(item1.targetAmount).toBe(250000);
      expect(item1.shares).toBe(7);
      expect(item1.estCost).toBe(245000);
      expect(item1.carryOut).toBe(5000);

      // Item 2: KODEX 미국 S&P500 TR
      // targetAmount = 500,000 * 0.3 = 150,000
      // shares = floor(150,000 / 15,000) = 10
      // estCost = 10 * 15,000 = 150,000
      // carryOut = 0
      const item2 = result.items[1];
      expect(item2.ticker).toBe('379800');
      expect(item2.targetAmount).toBe(150000);
      expect(item2.shares).toBe(10);
      expect(item2.estCost).toBe(150000);
      expect(item2.carryOut).toBe(0);

      // Item 3: TIGER 미국나스닥100
      // targetAmount = 500,000 * 0.2 = 100,000
      // shares = floor(100,000 / 12,000) = 8
      // estCost = 8 * 12,000 = 96,000
      // carryOut = 4,000
      const item3 = result.items[2];
      expect(item3.ticker).toBe('439870');
      expect(item3.targetAmount).toBe(100000);
      expect(item3.shares).toBe(8);
      expect(item3.estCost).toBe(96000);
      expect(item3.carryOut).toBe(4000);

      // Check carryOutByTicker
      expect(result.carryOutByTicker['069500']).toBe(5000);
      expect(result.carryOutByTicker['379800']).toBe(0);
      expect(result.carryOutByTicker['439870']).toBe(4000);

      // Check totals
      expect(result.totals.totalEstCost).toBe(491000); // 245000 + 150000 + 96000
      expect(result.totals.totalCarryOut).toBe(9000); // 5000 + 0 + 4000
    });
  });

  describe('Case B: Price too high (shares = 0)', () => {
    it('should return 0 shares when price exceeds budget', () => {
      const expensiveHoldings: Holding[] = [
        { ticker: 'EXPENSIVE', name: 'Expensive Stock', market: 'KRX', targetWeight: 1.0 },
      ];

      const input: CalculateExecutionInput = {
        monthlyBudget: 100000,
        cycleWeight: 0.5,
        holdings: expensiveHoldings,
        prices: { EXPENSIVE: 100000 }, // Price > cycleBudget * targetWeight
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      const result = calculateExecution(input);

      // cycleBudget = 100,000 * 0.5 = 50,000
      // targetAmount = 50,000 * 1.0 = 50,000
      // shares = floor(50,000 / 100,000) = 0
      // carryOut = 50,000
      expect(result.items[0].shares).toBe(0);
      expect(result.items[0].estCost).toBe(0);
      expect(result.items[0].carryOut).toBe(50000);
    });
  });

  describe('Case C: With carry-in from previous cycle', () => {
    it('should include carry-in in calculation', () => {
      const holdings: Holding[] = [
        { ticker: '069500', name: 'KODEX 200', market: 'KRX', targetWeight: 1.0 },
      ];

      const input: CalculateExecutionInput = {
        monthlyBudget: 100000,
        cycleWeight: 0.5,
        holdings,
        prices: { '069500': 35000 },
        carryInByTicker: { '069500': 20000 }, // Carry-in from previous cycle
        exchangeRates: defaultExchangeRates,
      };

      const result = calculateExecution(input);

      // cycleBudget = 100,000 * 0.5 = 50,000
      // targetAmount = 50,000 * 1.0 = 50,000
      // budgetForTicker = 50,000 + 20,000 = 70,000
      // shares = floor(70,000 / 35,000) = 2
      // estCost = 2 * 35,000 = 70,000
      // carryOut = 70,000 - 70,000 = 0
      expect(result.items[0].carryIn).toBe(20000);
      expect(result.items[0].shares).toBe(2);
      expect(result.items[0].estCost).toBe(70000);
      expect(result.items[0].carryOut).toBe(0);
    });

    it('should accumulate carry-out when still insufficient', () => {
      const holdings: Holding[] = [
        { ticker: '069500', name: 'KODEX 200', market: 'KRX', targetWeight: 1.0 },
      ];

      const input: CalculateExecutionInput = {
        monthlyBudget: 100000,
        cycleWeight: 0.5,
        holdings,
        prices: { '069500': 35000 },
        carryInByTicker: { '069500': 10000 },
        exchangeRates: defaultExchangeRates,
      };

      const result = calculateExecution(input);

      // budgetForTicker = 50,000 + 10,000 = 60,000
      // shares = floor(60,000 / 35,000) = 1
      // estCost = 35,000
      // carryOut = 60,000 - 35,000 = 25,000
      expect(result.items[0].shares).toBe(1);
      expect(result.items[0].carryOut).toBe(25000);
    });
  });

  describe('Case D: Invalid target weight sum', () => {
    it('should throw ValidationError when weights do not sum to 1.0', () => {
      const invalidHoldings: Holding[] = [
        { ticker: '069500', name: 'KODEX 200', market: 'KRX', targetWeight: 0.5 },
        { ticker: '379800', name: 'KODEX 미국 S&P500', market: 'KRX', targetWeight: 0.3 },
        // Missing 0.2 - sum is 0.8
      ];

      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: invalidHoldings,
        prices: { '069500': 35000, '379800': 15000 },
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      expect(() => calculateExecution(input)).toThrow(ValidationError);
      expect(() => calculateExecution(input)).toThrow('target weights');
    });

    it('should allow weights within epsilon tolerance', () => {
      const almostValidHoldings: Holding[] = [
        { ticker: '069500', name: 'KODEX 200', market: 'KRX', targetWeight: 0.3333 },
        { ticker: '379800', name: 'KODEX 미국 S&P500', market: 'KRX', targetWeight: 0.3333 },
        { ticker: '439870', name: 'TIGER 미국나스닥100', market: 'KRX', targetWeight: 0.3334 },
      ];

      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: almostValidHoldings,
        prices: samplePrices,
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      // Should not throw - sum is 1.0000 within epsilon
      expect(() => calculateExecution(input)).not.toThrow();
    });
  });

  describe('Case E: Invalid prices', () => {
    it('should throw ValidationError when price is missing', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: sampleHoldings,
        prices: { '069500': 35000 }, // Missing other prices
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      expect(() => calculateExecution(input)).toThrow(ValidationError);
      expect(() => calculateExecution(input)).toThrow('missing');
    });

    it('should throw ValidationError when price is zero', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: sampleHoldings,
        prices: { ...samplePrices, '069500': 0 },
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      expect(() => calculateExecution(input)).toThrow(ValidationError);
      expect(() => calculateExecution(input)).toThrow('positive');
    });

    it('should throw ValidationError when price is negative', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: sampleHoldings,
        prices: { ...samplePrices, '069500': -1000 },
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      expect(() => calculateExecution(input)).toThrow(ValidationError);
    });
  });

  describe('Edge cases', () => {
    it('should throw ValidationError for empty holdings', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: [],
        prices: {},
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      expect(() => calculateExecution(input)).toThrow(ValidationError);
      expect(() => calculateExecution(input)).toThrow('empty');
    });

    it('should throw ValidationError for invalid cycle weight', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0, // Invalid
        holdings: [{ ticker: 'TEST', name: 'Test', market: 'KRX', targetWeight: 1.0 }],
        prices: { TEST: 10000 },
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      expect(() => calculateExecution(input)).toThrow(ValidationError);
    });

    it('should throw ValidationError for negative monthly budget', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: -1000,
        cycleWeight: 0.5,
        holdings: [{ ticker: 'TEST', name: 'Test', market: 'KRX', targetWeight: 1.0 }],
        prices: { TEST: 10000 },
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      expect(() => calculateExecution(input)).toThrow(ValidationError);
    });

    it('should handle zero monthly budget', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 0,
        cycleWeight: 0.5,
        holdings: [{ ticker: 'TEST', name: 'Test', market: 'KRX', targetWeight: 1.0 }],
        prices: { TEST: 10000 },
        carryInByTicker: {},
        exchangeRates: defaultExchangeRates,
      };

      const result = calculateExecution(input);
      expect(result.cycleBudget).toBe(0);
      expect(result.items[0].shares).toBe(0);
      expect(result.items[0].carryOut).toBe(0);
    });

    it('should throw ValidationError for negative carry-in', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: [{ ticker: 'TEST', name: 'Test', market: 'KRX', targetWeight: 1.0 }],
        prices: { TEST: 10000 },
        carryInByTicker: { TEST: -5000 },
        exchangeRates: defaultExchangeRates,
      };

      expect(() => calculateExecution(input)).toThrow(ValidationError);
    });
  });

  describe('Currency conversion', () => {
    it('should convert USD prices to KRW for calculation', () => {
      // US stock with USD price
      const usHoldings: Holding[] = [
        { ticker: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ', targetWeight: 1.0 },
      ];

      const input: CalculateExecutionInput = {
        monthlyBudget: 1350000, // 1,350,000 KRW
        cycleWeight: 1.0,
        holdings: usHoldings,
        prices: { AAPL: 180 }, // $180 USD
        carryInByTicker: {},
        exchangeRates: { KRW: 1, USD: 1350 }, // 1 USD = 1350 KRW
      };

      const result = calculateExecution(input);

      // priceInKRW = 180 * 1350 = 243,000 KRW
      // shares = floor(1,350,000 / 243,000) = 5
      // estCost = 5 * 243,000 = 1,215,000 KRW
      // carryOut = 1,350,000 - 1,215,000 = 135,000 KRW
      expect(result.items[0].price).toBe(180); // Original USD price
      expect(result.items[0].priceCurrency).toBe('USD');
      expect(result.items[0].priceInKRW).toBe(243000);
      expect(result.items[0].shares).toBe(5);
      expect(result.items[0].estCost).toBe(1215000);
      expect(result.items[0].carryOut).toBe(135000);
    });

    it('should handle mixed KRW and USD holdings', () => {
      const mixedHoldings: Holding[] = [
        { ticker: '005930', name: '삼성전자', market: 'KRX', targetWeight: 0.5 },
        { ticker: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ', targetWeight: 0.5 },
      ];

      const input: CalculateExecutionInput = {
        monthlyBudget: 2000000, // 2,000,000 KRW
        cycleWeight: 1.0,
        holdings: mixedHoldings,
        prices: {
          '005930': 70000, // 70,000 KRW
          AAPL: 180, // $180 USD
        },
        carryInByTicker: {},
        exchangeRates: { KRW: 1, USD: 1350 },
      };

      const result = calculateExecution(input);

      // Samsung (KRW)
      // targetAmount = 2,000,000 * 0.5 = 1,000,000 KRW
      // shares = floor(1,000,000 / 70,000) = 14
      // estCost = 14 * 70,000 = 980,000 KRW
      const samsungItem = result.items.find((i) => i.ticker === '005930');
      expect(samsungItem?.priceCurrency).toBe('KRW');
      expect(samsungItem?.priceInKRW).toBe(70000);
      expect(samsungItem?.shares).toBe(14);
      expect(samsungItem?.estCost).toBe(980000);

      // Apple (USD)
      // targetAmount = 2,000,000 * 0.5 = 1,000,000 KRW
      // priceInKRW = 180 * 1350 = 243,000 KRW
      // shares = floor(1,000,000 / 243,000) = 4
      // estCost = 4 * 243,000 = 972,000 KRW
      const appleItem = result.items.find((i) => i.ticker === 'AAPL');
      expect(appleItem?.priceCurrency).toBe('USD');
      expect(appleItem?.price).toBe(180);
      expect(appleItem?.priceInKRW).toBe(243000);
      expect(appleItem?.shares).toBe(4);
      expect(appleItem?.estCost).toBe(972000);

      // Total should be in KRW
      expect(result.totals.totalEstCost).toBe(980000 + 972000);
    });

    it('should include exchange rates in output', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: [{ ticker: 'TEST', name: 'Test', market: 'KRX', targetWeight: 1.0 }],
        prices: { TEST: 10000 },
        carryInByTicker: {},
        exchangeRates: { KRW: 1, USD: 1400 },
      };

      const result = calculateExecution(input);
      expect(result.exchangeRates).toEqual({ KRW: 1, USD: 1400 });
    });

    it('should throw error for invalid exchange rates', () => {
      const input: CalculateExecutionInput = {
        monthlyBudget: 1000000,
        cycleWeight: 0.5,
        holdings: [{ ticker: 'TEST', name: 'Test', market: 'KRX', targetWeight: 1.0 }],
        prices: { TEST: 10000 },
        carryInByTicker: {},
        exchangeRates: { KRW: 2, USD: 1350 }, // Invalid: KRW must be 1
      };

      expect(() => calculateExecution(input)).toThrow('KRW exchange rate must be 1');
    });
  });
});
