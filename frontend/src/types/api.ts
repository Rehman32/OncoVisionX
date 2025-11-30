/**
 * API Response wrapper
 * All backend responses follow this structure
 */
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  errors?: any[];
}

/**
 * API Error response
 */
export interface APIError {
  success: false;
  message: string;
  errors?: any[];
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Search params
 */
export interface SearchParams {
  search?: string;
}
