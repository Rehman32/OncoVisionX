import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Prediction } from '@/types/prediction';
import { Patient } from '@/types/patient';
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

export interface CreatePredictionPayload {
  patient: Patient;
  file: File;
  overrides?: {
    anatomicalSite?: string;
  };
}

const createPrediction = async ({ patient, file, overrides }: CreatePredictionPayload) => {
  const formData = new FormData();
  formData.append('image', file);
  
  // Send metadata with potential overrides
  formData.append('metadata', JSON.stringify({
    age: patient.age || 0,
    sex: patient.sex,
    anatomical_site: overrides?.anatomicalSite || patient.anatomicalSite,
  }));
  
  formData.append('patientId', patient._id);

  const { data: response } = await apiClient.post<APIResponse<Prediction>>('/predictions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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
    refetchInterval: false,
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request triage prediction');
    },
  });
}
