import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentAction } from '@/types/entities';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentActionsWidgetProps {
  actions: RecentAction[];
  isLoading?: boolean;
}

const actionIcons = {
  create: Plus,
  edit: Pencil,
  delete: Trash2,
};

const actionColors = {
  create: 'bg-success/10 text-success',
  edit: 'bg-primary/10 text-primary',
  delete: 'bg-destructive/10 text-destructive',
};

const actionLabels = {
  create: 'Создание',
  edit: 'Редактирование',
  delete: 'Удаление',
};

const entityLabels: Record<string, string> = {
  bot: 'Бот',
  plan: 'Тариф',
  payment: 'Платёж',
  subscription: 'Подписка',
  user: 'Пользователь',
  message: 'Сообщение',
  payment_method: 'Способ оплаты',
  group: 'Группа',
};

export const RecentActionsWidget: React.FC<RecentActionsWidgetProps> = ({
  actions,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Последние действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
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
        <CardTitle className="text-lg">Последние действия</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет недавних действий
            </p>
          ) : (
            actions.map((action) => {
              const Icon = actionIcons[action.action];
              return (
                <div
                  key={action.id}
                  className="flex items-start gap-3 animate-fade-in"
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg flex-shrink-0',
                      actionColors[action.action]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {actionLabels[action.action]}: {action.entityName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entityLabels[action.entityType] || action.entityType} •{' '}
                      {action.userName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(action.timestamp), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
