import { apiClient } from './client';
import { DashboardStats, RecentAction, Payment, Subscription, User } from '@/types/entities';
import { getMockRecentActions } from './mockData';

const normalizeListResponse = <T>(payload: unknown): { data: T[]; total: number } => {
  if (Array.isArray(payload)) {
    return { data: payload as T[], total: payload.length };
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      const data = record.data as T[];
      return {
        data,
        total: Number(record.total ?? data.length) || data.length,
      };
    }
    if (Array.isArray(record.results)) {
      const data = record.results as T[];
      return {
        data,
        total: Number(record.count ?? data.length) || data.length,
      };
    }
  }
  return { data: [], total: 0 };
};

const parseAmount = (value: unknown): number => {
  const amount = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(amount) ? amount : 0;
};

const isSuccessStatus = (status: unknown): boolean => {
  const normalized = String(status ?? '').toLowerCase();
  return normalized === 'success' || normalized === 'completed';
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats/');
      return response.data;
    } catch {
      const [usersRes, subsRes, paymentsRes] = await Promise.all([
        apiClient.get<User[] | { results?: User[]; count?: number }>('/users/'),
        apiClient.get<Subscription[] | { results?: Subscription[]; count?: number }>(
          '/subscriptions/'
        ),
        apiClient.get<Payment[] | { results?: Payment[]; count?: number }>('/payments/'),
      ]);

      const users = normalizeListResponse<User>(usersRes.data);
      const subs = normalizeListResponse<Subscription>(subsRes.data);
      const payments = normalizeListResponse<Payment>(paymentsRes.data);

      const activeSubscriptions = subs.data.filter((s) => s.is_active).length;
      const today = new Date().toDateString();
      const todayPayments = payments.data.filter((p) => {
        if (!isSuccessStatus(p.status)) return false;
        const createdAt = p.created_at ? new Date(p.created_at).toDateString() : '';
        return createdAt === today;
      }).length;
      const totalRevenue = payments.data
        .filter((p) => isSuccessStatus(p.status))
        .reduce((sum, p) => sum + parseAmount(p.amount), 0);

      return {
        totalUsers: users.total,
        activeSubscriptions,
        todayPayments,
        totalRevenue,
        totalPayments: payments.total,
        userGrowth: 0,
        subscriptionGrowth: 0,
        paymentGrowth: 0,
        revenueGrowth: 0,
      };
    }
  },

  getRecentActions: async (limit: number = 10): Promise<RecentAction[]> => {
    try {
      const response = await apiClient.get<RecentAction[]>('/dashboard/recent-actions/', {
        params: { limit },
      });
      return response.data;
    } catch {
      const fallback = getMockRecentActions();
      return fallback
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(0, limit);
    }
  },

  getRecentPayments: async (limit: number = 5): Promise<Payment[]> => {
    try {
      const response = await apiClient.get<Payment[]>('/dashboard/recent-payments/', {
        params: { limit },
      });
      return response.data;
    } catch {
      const response = await apiClient.get<Payment[] | { results?: Payment[] }>(
        '/payments/',
        { params: { limit } }
      );
      const normalized = normalizeListResponse<Payment>(response.data);
      const sorted = [...normalized.data].sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : NaN;
        const bTime = b.created_at ? Date.parse(b.created_at) : NaN;
        if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
          return bTime - aTime;
        }
        const aId = Number(a.id);
        const bId = Number(b.id);
        if (!Number.isNaN(aId) && !Number.isNaN(bId) && aId !== bId) {
          return bId - aId;
        }
        return String(b.id).localeCompare(String(a.id));
      });
      return sorted.slice(0, limit);
    }
  },
};
