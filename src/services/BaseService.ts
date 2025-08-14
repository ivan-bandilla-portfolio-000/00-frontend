import { RateLimiter } from '@/features/rate-limiting/client/services/RateLimiter';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

export class BaseService {
  protected static axiosInst: AxiosInstance = axios.create({});

  // Generic CRUD methods
  protected static async get<T>(url: string, params?: Record<string, any>): Promise<AxiosResponse<T>> {
    return await this.axiosInst.get<T>(url, { params });
  }

  protected static async post<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return await this.axiosInst.post<T>(url, data);
  }

  protected static async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return await this.axiosInst.put<T>(url, data);
  }

  protected static async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return await this.axiosInst.delete<T>(url);
  }

  protected static async rateLimited<T>(key: string, limit: number, windowMs: number, fn: () => Promise<T>): Promise<T> {
    await RateLimiter.throwIfLimited(key, limit, windowMs);
    return fn();
  }

  // Setup interceptors for auth, error handling, etc.
  static setupInterceptors() {
    this.axiosInst.interceptors.request.use(
      (config) => {
        // Add auth token if needed
        // const token = localStorage.getItem('auth_token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        config.headers['X-Timezone'] = timezone;


        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInst.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
}

// Initialize interceptors
BaseService.setupInterceptors();