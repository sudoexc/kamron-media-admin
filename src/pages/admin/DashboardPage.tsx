import React, { useEffect, useState } from 'react';
import { Users, CreditCard, Receipt, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActionsWidget } from '@/components/dashboard/RecentActionsWidget';
import { RecentPaymentsWidget } from '@/components/dashboard/RecentPaymentsWidget';
import { dashboardApi } from '@/api/dashboard';
import { DashboardStats, RecentAction, Payment } from '@/types/entities';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, actionsData, paymentsData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentActions(10),
          dashboardApi.getRecentPayments(5),
        ]);
        setStats(statsData);
        setRecentActions(actionsData);
        setRecentPayments(paymentsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Панель управления</h1>
        <p className="text-muted-foreground">Обзор ключевых показателей</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Всего пользователей"
          value={isLoading ? '...' : stats?.totalUsers || 0}
          icon={Users}
          change={stats?.userGrowth}
        />
        <StatsCard
          title="Активные подписки"
          value={isLoading ? '...' : stats?.activeSubscriptions || 0}
          icon={Receipt}
          change={stats?.subscriptionGrowth}
        />
        <StatsCard
          title="Платежи сегодня"
          value={isLoading ? '...' : stats?.todayPayments || 0}
          icon={CreditCard}
          change={stats?.paymentGrowth}
        />
        <StatsCard
          title="Общий доход"
          value={isLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
          icon={TrendingUp}
          change={stats?.revenueGrowth}
        />
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActionsWidget actions={recentActions} isLoading={isLoading} />
        <RecentPaymentsWidget payments={recentPayments} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default DashboardPage;
