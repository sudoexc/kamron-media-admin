import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Payment } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface RecentPaymentsWidgetProps {
  payments: Payment[];
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  completed: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  refunded: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  completed: 'Выполнен',
  pending: 'В обработке',
  failed: 'Ошибка',
  refunded: 'Возврат',
};

export const RecentPaymentsWidget: React.FC<RecentPaymentsWidgetProps> = ({
  payments,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Последние платежи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg">Последние платежи</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет платежей
            </p>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {payment.userName || `Пользователь #${payment.userId}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(payment.createdAt), 'dd MMM, HH:mm', {
                      locale: ru,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{payment.amount} ₽</span>
                  <Badge variant="outline" className={statusColors[payment.status]}>
                    {statusLabels[payment.status]}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
