import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DoctorsResponse {
  success: boolean;
  data: Doctor[];
}

const fetchDoctors = async (): Promise<DoctorsResponse> => {
  const { data } = await apiClient.get<DoctorsResponse>('/users/doctors');
  return data;
};

/**
 * Hook to fetch list of active doctors for dropdown population
 */
export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: fetchDoctors,
    staleTime: 60000, // Cache for 1 minute
  });
}
