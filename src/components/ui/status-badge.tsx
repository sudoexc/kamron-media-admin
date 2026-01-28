import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'success' | 'warning' | 'error' | 'default' | 'info';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  label?: string;
}

const statusTypeClasses: Record<StatusType, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  default: 'bg-muted text-muted-foreground border-border',
};

// Auto-detect status type based on common status values
const autoDetectType = (status: string): StatusType => {
  const lowerStatus = status.toLowerCase();
  if (['active', 'completed', 'success', 'read', 'delivered'].includes(lowerStatus)) {
    return 'success';
  }
  if (['pending', 'processing', 'sent'].includes(lowerStatus)) {
    return 'warning';
  }
  if (['inactive', 'failed', 'error', 'expired', 'suspended', 'cancelled'].includes(lowerStatus)) {
    return 'error';
  }
  return 'default';
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  label,
}) => {
  const detectedType = type || autoDetectType(status);

  return (
    <Badge variant="outline" className={cn(statusTypeClasses[detectedType])}>
      {label || status}
    </Badge>
  );
};
