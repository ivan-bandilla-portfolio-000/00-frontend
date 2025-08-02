import { BaseService } from './baseService';

const API_BASE = import.meta.env.VITE_PORTFOLIO_API_BASE;

export class BackendService extends BaseService {
    /**
     * Ensure CSRF cookie is set (for Laravel Sanctum/session).
     */
    static async initCsrf(): Promise<void> {
        await this.axiosInst.get(`${API_BASE}/sanctum/csrf-cookie`, {
            withCredentials: true,
        });
    }

    /**
     * POST request with CSRF/session support.
     */
    static async postWithSession<T>(endpoint: string, data?: any) {
        await this.initCsrf();
        return this.axiosInst.post<T>(`${API_BASE}${endpoint}`, data, {
            withCredentials: true,
        });
    }

    /**
     * GET request with CSRF/session support.
     */
    static async getWithSession<T>(endpoint: string, params?: Record<string, any>) {
        await this.initCsrf();
        return this.axiosInst.get<T>(`${API_BASE}${endpoint}`, {
            params,
            withCredentials: true,
        });
    }
}

// Usage
// import { BackendService } from '@/services/BackendService';

// await BackendService.postWithSession('/api/contact', { name: 'John', message: 'Hello!' });