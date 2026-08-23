import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { getSession } from '../store/session';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getSession()?.tokens?.accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Trigger a client-side logout / redirect as needed.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credible:unauthorized'));
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { page: number; perPage: number; total: number; totalPages: number };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function extractError(err: unknown): { code: string; message: string } {
  if (axios.isAxiosError<ApiError>(err)) {
    const data = err.response?.data;
    if (data && !data.success) {
      return { code: data.error.code, message: data.error.message };
    }
    return { code: err.code ?? 'NETWORK_ERROR', message: err.message };
  }
  if (err instanceof Error) return { code: 'UNEXPECTED', message: err.message };
  return { code: 'UNEXPECTED', message: 'Unexpected error' };
}