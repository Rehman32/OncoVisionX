import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { UserSettings, SettingsUpdatePayload } from '@/types/settings';
import { APIResponse } from '@/types/api';

export const settingsKeys = {
  all: ['settings'] as const,
  current: () => [...settingsKeys.all, 'current'] as const,
};

// API Functions
const getSettings = async () => {
  const { data } = await apiClient.get<APIResponse<UserSettings>>('/settings');
  return data.data;
};

const updateSettings = async (updates: SettingsUpdatePayload) => {
  const { data } = await apiClient.put<APIResponse<UserSettings>>('/settings', updates);
  return data.data;
};

const resetSettings = async () => {
  const { data } = await apiClient.post<APIResponse<void>>('/settings/reset');
  return data.data;
};

// Hooks
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.current(),
    queryFn: getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.current(), data);
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });
}

export function useResetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      toast.success('Settings reset to defaults');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset settings');
    },
  });
}