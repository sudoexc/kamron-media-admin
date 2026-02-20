import { apiClient } from './client';

export interface LanguageBreakdown {
  count: number;
  ru: number;
  en: number;
  uz__lotin: number;
  uz__kiril: number;
}

export interface BotSnapshot {
  id: string | number;
  title: string;
  port: number;
  stats: DailyStatsSnapshot;
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
  date?: string;
  bots?: BotSnapshot[];
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

const snapshotToPoint = (s: DailyStatsSnapshot, botPort?: number): GrowthChartPoint => {
  const label = s.date
    ? s.date.slice(5).replace('-', '.')  // "02.20"
    : new Date(s.timestamp * 1000).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

  if (botPort && s.bots) {
    const bot = s.bots.find((b) => b.port === botPort);
    if (bot) {
      return {
        date: label,
        total: bot.stats.total,
        newUsers: bot.stats.new_users,
        newGroups: bot.stats.new_groups,
        premiumUsers: bot.stats.premium_users,
        blockedUsers: bot.stats.blocked_users,
        downloads: bot.stats.downloads,
      };
    }
  }

  return {
    date: label,
    total: s.total,
    newUsers: s.new_users,
    newGroups: s.new_groups,
    premiumUsers: s.premium_users,
    blockedUsers: s.blocked_users,
    downloads: s.downloads,
  };
};

export const statisticsApi = {
  getLatestSnapshot: async (): Promise<DailyStatsSnapshot | null> => {
    try {
      const response = await apiClient.get<DailyStatsSnapshot>('/statistics/latest/');
      return response.data;
    } catch {
      return null;
    }
  },

  getHistory: async (
    period: GrowthPeriod,
    customFrom?: string,
    customTo?: string,
    botPort?: number
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
      return snapshots.map((s) => snapshotToPoint(s, botPort));
    } catch {
      return [];
    }
  },
};
