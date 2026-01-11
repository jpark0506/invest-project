import { apiClient } from '@/shared/api';
import type { Portfolio, UpdatePortfolioInput } from '@invest-assist/core';

export type { Portfolio, UpdatePortfolioInput };

export interface GetPortfolioResponse {
  portfolio: Portfolio | null;
}

export interface PutPortfolioResponse {
  portfolio: Portfolio;
}

export const portfolioApi = {
  get: () => apiClient.get<GetPortfolioResponse>('/portfolio'),

  update: (data: UpdatePortfolioInput) =>
    apiClient.put<PutPortfolioResponse>('/portfolio', data),
};
