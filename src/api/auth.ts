import { MOCK_MODE, apiClient, mockDelay, setTokens, clearTokens } from './client';
import { LoginRequest, LoginResponse, RefreshResponse, AuthUser } from '@/types/entities';
import { mockAuthUser } from './mockData';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    if (MOCK_MODE) {
      await mockDelay(500);
      
      // Simple validation for demo
      if (data.email === 'admin@example.com' && data.password === 'admin123') {
        const response: LoginResponse = {
          accessToken: 'mock-access-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
          user: mockAuthUser,
        };
        setTokens(response.accessToken, response.refreshToken);
        return response;
      }
      
      throw new Error('Неверный email или пароль');
    }

    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    if (MOCK_MODE) {
      await mockDelay(200);
      return {
        accessToken: 'mock-refreshed-token-' + Date.now(),
      };
    }

    const response = await apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  me: async (): Promise<AuthUser> => {
    if (MOCK_MODE) {
      await mockDelay(200);
      return mockAuthUser;
    }

    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    if (MOCK_MODE) {
      await mockDelay(100);
      clearTokens();
      return;
    }

    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },
};
