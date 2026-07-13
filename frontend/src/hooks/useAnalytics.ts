import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/api';

export function useAnalytics(period?: string) {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: () => analyticsService.getMetrics(period),
    staleTime: 5 * 60 * 1000,
  });
}
