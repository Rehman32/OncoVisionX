import { apiClient } from './client';
import { APIResponse, PaginationParams, SearchParams } from '@/types/api';
import { Patient, CreatePatientRequest } from '@/types/patient';

export const patientsApi = {
  /**
   * Get all patients with pagination and search
   */
  getPatients: async (params?: PaginationParams & SearchParams) => {
    const response = await apiClient.get<APIResponse<Patient[]>>('/patients', { params });
    return response.data;
  },

  /**
   * Get single patient by ID
   */
  getPatient: async (id: string) => {
    const response = await apiClient.get<APIResponse<Patient>>(`/patients/${id}`);
    return response.data;
  },

  /**
   * Create new patient
   */
  createPatient: async (data: CreatePatientRequest) => {
    const response = await apiClient.post<APIResponse<Patient>>('/patients', data);
    return response.data;
  },

  /**
   * Update patient
   */
  updatePatient: async (id: string, data: Partial<CreatePatientRequest>) => {
    const response = await apiClient.put<APIResponse<Patient>>(`/patients/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate patient (soft delete)
   */
  deactivatePatient: async (id: string) => {
    const response = await apiClient.delete<APIResponse>(`/patients/${id}`);
    return response.data;
  },
};
