import React from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  to,
  icon: Icon,
  label,
  collapsed = false,
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <RouterNavLink
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-primary/10 text-primary shadow-glow-sm',
        !isActive && 'text-sidebar-foreground/70',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
      {!collapsed && <span className="truncate">{label}</span>}
    </RouterNavLink>
  );
};

interface SidebarNavGroupProps {
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

export const SidebarNavGroup: React.FC<SidebarNavGroupProps> = ({
  title,
  children,
  collapsed = false,
}) => {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          {title}
        </h3>
      )}
      <nav className="space-y-0.5">{children}</nav>
    </div>
  );
};
