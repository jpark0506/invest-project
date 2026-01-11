import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi, UpdatePortfolioInput } from '../api';

export function usePortfolio() {
  return useQuery({
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
