import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi, UpdatePortfolioInput } from '../api';

export function usePortfolio() {
  return useSuspenseQuery({
    queryKey: ['portfolio'],
    queryFn: () => portfolioApi.get(),
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePortfolioInput) => portfolioApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}
