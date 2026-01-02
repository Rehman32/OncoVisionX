import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { CreatePredictionRequest, Prediction } from '@/types/prediction';
import { APIResponse } from '@/types/api';

export const predictionKeys = {
  all: ['predictions'] as const,
  lists: () => [...predictionKeys.all, 'list'] as const,
  detail: (id: string) => [...predictionKeys.all, 'detail', id] as const,
};

// --- API Functions ---
const getPredictions = async (params?: any) => {
  const { data } = await apiClient.get<APIResponse<Prediction[]>>('/predictions', { params });
  return data;
};

const getPrediction = async (id: string) => {
  const { data } = await apiClient.get<APIResponse<Prediction>>(`/predictions/${id}`);
  return data;
};

const createPrediction = async (data: CreatePredictionRequest) => {
  const { data: response } = await apiClient.post<APIResponse<Prediction>>('/predictions', data);
  return response.data;
};

// --- Hooks ---
export function usePredictions(params?: any) {
  return useQuery({
    queryKey: predictionKeys.lists(),
    queryFn: () => getPredictions(params),
  });
}

export function usePrediction(id: string) {
  return useQuery({
    queryKey: predictionKeys.detail(id),
    queryFn: () => getPrediction(id),
    refetchInterval: (query) => {
      // Auto-refetch if status is processing
      const status = query.state.data?.data?.status;
      return status === 'processing' || status === 'pending' ? 5000 : false;
    },
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.lists() });
      toast.success('Prediction request submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create prediction');
    },
  });
}
