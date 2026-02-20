import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  CreditCard,
  Users,
  MessageSquare,
  Wallet,
  Shield,
  BarChart3,
  TrendingUp,
  Package,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SidebarNavItem, SidebarNavGroup } from './SidebarNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">Admin</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <SidebarNavGroup title="Главная" collapsed={collapsed}>
          <SidebarNavItem
            to="/admin/dashboard"
            icon={LayoutDashboard}
            label="Панель управления"
            collapsed={collapsed}
          />
        </SidebarNavGroup>

        <SidebarNavGroup title="Платежи" collapsed={collapsed}>
          <SidebarNavItem
            to="/admin/bots"
            icon={Bot}
            label="Боты"
            collapsed={collapsed}
          />
          <SidebarNavItem
            to="/admin/subscription-plans"
            icon={Package}
            label="Тарифные планы"
            collapsed={collapsed}
          />
          <SidebarNavItem
            to="/admin/payments"
            icon={CreditCard}
            label="Платежи"
            collapsed={collapsed}
          />
          <SidebarNavItem
            to="/admin/subscriptions"
            icon={Receipt}
            label="Подписки"
            collapsed={collapsed}
          />
          <SidebarNavItem
            to="/admin/users"
            icon={Users}
            label="Пользователи"
            collapsed={collapsed}
          />
          <SidebarNavItem
            to="/admin/messages"
            icon={MessageSquare}
            label="Сообщения"
            collapsed={collapsed}
          />
          <SidebarNavItem
            to="/admin/payment-methods"
            icon={Wallet}
            label="Способы оплаты"
            collapsed={collapsed}
          />
        </SidebarNavGroup>

        <SidebarNavGroup title="Аналитика" collapsed={collapsed}>
          <SidebarNavItem
            to="/admin/analytics/subscriptions-report"
            icon={BarChart3}
            label="Отчёт по подпискам"
            collapsed={collapsed}
          />
          <SidebarNavItem
            to="/admin/analytics/statistics"
            icon={TrendingUp}
            label="Статистика роста"
            collapsed={collapsed}
          />
        </SidebarNavGroup>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50 text-center">
            Admin Panel v1.0
          </p>
        </div>
      )}
    </aside>
  );
};
