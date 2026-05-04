import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
};

// API Functions
const getDashboardStats = async () => {
  console.log('📊 Fetching dashboard stats...');
  const { data } = await apiClient.get('/dashboard/stats');
  console.log('✅ Dashboard stats received:', data.data);
  return data;
};

const getRecentActivity = async (limit: number = 10) => {
  console.log('📋 Fetching recent activity...');
  const { data } = await apiClient.get('/dashboard/activity', {
    params: { limit }
  });
  console.log('✅ Activity data received:', data.data.length, 'items');
  return data;
};

// Hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1, // Only retry once on failure
  });
}

export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: [...dashboardKeys.activity(), limit],
    queryFn: () => getRecentActivity(limit),
    refetchInterval: 30000,
    retry: 1,
  });
}
