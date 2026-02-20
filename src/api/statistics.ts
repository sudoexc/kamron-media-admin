import { apiClient } from './client';

// Structure returned by the Telegram bot stats API (stored daily at ~04:58 Tashkent time)
export interface LanguageBreakdown {
  count: number;
  ru: number;
  en: number;
  uz__lotin: number;
  uz__kiril: number;
}

export interface DailyStatsSnapshot {
  ok: boolean;
  total: number;
  new_users: number;
  new_groups: number;
  users: LanguageBreakdown;
  groups: LanguageBreakdown;
  unique_users: LanguageBreakdown;
  premium_users: number;
  unique_groups: number;
  blocked_users: number;
  downloads: number;
  timestamp: number;
  // added by backend when storing
  date?: string;
}

export interface GrowthChartPoint {
  date: string;
  total: number;
  newUsers: number;
  newGroups: number;
  premiumUsers: number;
  blockedUsers: number;
  downloads: number;
}

export type GrowthPeriod = '7d' | '30d' | '3m' | '1y' | 'custom';

export const statisticsApi = {
  // Fetch today's (latest) snapshot
  getLatestSnapshot: async (): Promise<DailyStatsSnapshot | null> => {
    try {
      const response = await apiClient.get<DailyStatsSnapshot>('/statistics/latest/');
      return response.data;
    } catch {
      return null;
    }
  },

  // Fetch historical snapshots for chart (stored daily by cron at 04:55 Tashkent)
  getHistory: async (
    period: GrowthPeriod,
    customFrom?: string,
    customTo?: string
  ): Promise<GrowthChartPoint[]> => {
    const params: Record<string, string> = {};

    if (period === 'custom' && customFrom && customTo) {
      params.from = customFrom;
      params.to = customTo;
    } else {
      params.period = period;
    }

    try {
      const response = await apiClient.get<DailyStatsSnapshot[]>('/statistics/history/', { params });
      const snapshots = Array.isArray(response.data) ? response.data : [];
      return snapshots.map((s) => ({
        date: s.date ?? new Date(s.timestamp * 1000).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        total: s.total,
        newUsers: s.new_users,
        newGroups: s.new_groups,
        premiumUsers: s.premium_users,
        blockedUsers: s.blocked_users,
        downloads: s.downloads,
      }));
    } catch {
      return [];
    }
  },
};
