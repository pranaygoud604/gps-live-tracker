import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { AuthUser, FleetStats, DriverSession, RegisteredDriver } from '@/types';

const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';

interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

interface LoginPayload {
  vehicleNumber?: string;
  username?: string;
  password: string;
}

interface LoginData {
  token: string;
  user: AuthUser;
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiResponse>) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return client;
}

const api = createApiClient();

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginData> => {
    const res = await api.post<ApiResponse<LoginData>>('/auth/login', payload);
    if (!res.data.data) throw new Error('No data in response');
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<AuthUser> => {
    const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
    if (!res.data.data) throw new Error('No data in response');
    return res.data.data;
  },
};

export const driversApi = {
  getAll: async (): Promise<{ sessions: DriverSession[]; stats: FleetStats }> => {
    const res = await api.get<ApiResponse<{ sessions: DriverSession[]; stats: FleetStats }>>('/drivers');
    if (!res.data.data) throw new Error('No data in response');
    return res.data.data;
  },

  getStats: async (): Promise<FleetStats> => {
    const res = await api.get<ApiResponse<FleetStats>>('/drivers/stats');
    if (!res.data.data) throw new Error('No data in response');
    return res.data.data;
  },

  getRegistered: async (): Promise<RegisteredDriver[]> => {
    const res = await api.get<ApiResponse<RegisteredDriver[]>>('/drivers/list');
    if (!res.data.data) throw new Error('No data in response');
    return res.data.data;
  },

  create: async (data: { name: string; vehicleNumber: string; phone: string; password: string }): Promise<RegisteredDriver> => {
    const res = await api.post<ApiResponse<RegisteredDriver>>('/drivers', data);
    if (!res.data.data) throw new Error('No data in response');
    return res.data.data;
  },

  update: async (id: string, data: { name?: string; phone?: string; password?: string }): Promise<RegisteredDriver> => {
    const res = await api.put<ApiResponse<RegisteredDriver>>(`/drivers/${id}`, data);
    if (!res.data.data) throw new Error('No data in response');
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/drivers/${id}`);
  },
};

export default api;
