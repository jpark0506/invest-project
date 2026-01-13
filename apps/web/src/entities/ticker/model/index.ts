import { useQuery } from '@tanstack/react-query';
import type { Market } from '@invest-assist/core';
import { tickerApi } from '../api';

export function useTickerSearch(query: string, market?: Market) {
  return useQuery({
    queryKey: ['tickers', 'search', query, market],
    queryFn: () => tickerApi.search(query, market),
    enabled: query.length >= 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
