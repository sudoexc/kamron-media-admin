import { MOCK_MODE, apiClient, mockDelay } from './client';
import { DashboardStats, RecentAction, Payment } from '@/types/entities';
import { getMockDashboardStats, getMockRecentActions, getMockPayments } from './mockData';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    if (MOCK_MODE) {
      await mockDelay();
      return getMockDashboardStats();
    }
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getRecentActions: async (limit: number = 10): Promise<RecentAction[]> => {
    if (MOCK_MODE) {
      await mockDelay();
      return getMockRecentActions().slice(0, limit);
    }
    const response = await apiClient.get<RecentAction[]>('/dashboard/recent-actions', {
      params: { limit },
    });
    return response.data;
  },

  getRecentPayments: async (limit: number = 5): Promise<Payment[]> => {
    if (MOCK_MODE) {
      await mockDelay();
      return getMockPayments().slice(0, limit);
    }
    const response = await apiClient.get<Payment[]>('/dashboard/recent-payments', {
      params: { limit },
    });
    return response.data;
  },
};
