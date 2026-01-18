import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planApi, UpdatePlanInput } from '../api';

export function usePlan() {
  return useSuspenseQuery({
    queryKey: ['plan'],
    queryFn: () => planApi.get(),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePlanInput & { email?: string }) => planApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}
