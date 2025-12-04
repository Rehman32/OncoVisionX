import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/lib/api/patients';
import { toast } from 'sonner';
import { PaginationParams, SearchParams } from '@/types/api';

/**
 * Query key factory for patients
 * Helps with cache invalidation
 */
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (params?: PaginationParams & SearchParams) => 
    [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

/**
 * Hook to fetch patients list
 */
export function usePatients(params?: PaginationParams & SearchParams) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientsApi.getPatients(params),
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Hook to fetch single patient
 */
export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientsApi.getPatient(id),
    enabled: !!id, // Only fetch if id exists
  });
}

/**
 * Hook to create patient
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsApi.createPatient,
    onSuccess: (data) => {
      // Invalidate patients list to refetch
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      toast.success('Patient created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create patient');
    },
  });
}

/**
 * Hook to update patient
 */
export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => patientsApi.updatePatient(id, data),
    onSuccess: (data) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(id) });
      toast.success('Patient updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update patient');
    },
  });
}

/**
 * Hook to delete patient
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsApi.deactivatePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      toast.success('Patient deactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate patient');
    },
  });
}
