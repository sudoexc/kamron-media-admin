import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/table/DataTable';
import { DataTableSearch } from '@/components/table/DataTableSearch';
import { DataTablePagination } from '@/components/table/DataTablePagination';
import { DataTableActions } from '@/components/table/DataTableActions';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { subscriptionsApi, botsApi, plansApi, usersApi } from '@/api/entities';
import { apiClient } from '@/api/client';
import { Subscription, Bot, SubscriptionPlan, User, SubscriptionRef } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logRecentAction } from '@/lib/recent-actions';
import axios from 'axios';

const SubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Subscription[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const normalizeList = <T,>(
        payload: T[] | { results?: T[] } | null | undefined
      ): T[] => {
        if (Array.isArray(payload)) return payload;
        return payload?.results ?? [];
      };

      const [subsResponse, botsResponse, plansResponse, usersResponse] =
        await Promise.all([
          subscriptionsApi.getAll(),
          botsApi.getAll(),
          plansApi.getAll(),
          usersApi.getAll(),
        ]);
      const subsList = normalizeList(subsResponse as unknown);
      const sortedSubs = [...subsList].sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : Date.parse(a.start_date);
        const bTime = b.created_at ? Date.parse(b.created_at) : Date.parse(b.start_date);
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
      setData(sortedSubs);
      setBots(normalizeList(botsResponse as unknown));
      setPlans(normalizeList(plansResponse as unknown));
      setUsers(normalizeList(usersResponse as unknown));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedIds([]);
  }, [data]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const target = data.find((sub) => String(sub.id) === deleteId);
      await subscriptionsApi.delete(deleteId);
      if (target) {
        const userId = getRefId(target.user);
        const botId = getRefId(target.bot);
        const planId = getRefId(target.plan);
        if (userId && botId && planId) {
          try {
            await apiClient.post('/send_purchase_notification/', {
              user_id: userId,
              bot_id: botId,
              plan_id: planId,
              language: getUserLanguage(userId),
              message_identifier: 'subscription_expired',
            });
          } catch (error) {
            let details = '';
            if (axios.isAxiosError(error)) {
              const data = error.response?.data as
                | Record<string, unknown>
                | string
                | undefined;
              if (typeof data === 'string') {
                details = data;
              } else if (data && typeof data === 'object') {
                details = Object.entries(data)
                  .map(([key, value]) => `${key}: ${String(value)}`)
                  .join(' | ');
              }
            }
            toast({
              title: 'Уведомление не отправлено',
              description: details || 'Не удалось отправить уведомление о подписке',
              variant: 'destructive',
            });
          }
        }
      }
      logRecentAction({
        entityType: 'subscription',
        entityId: deleteId,
        entityName: target
          ? `Подписка #${target.id}`
          : `Подписка #${deleteId}`,
        action: 'delete',
      });
      toast({ title: 'Успешно', description: 'Подписка удалена' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить подписку',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const targets = selectedIds.map((id) => {
        const sub = data.find((item) => String(item.id) === id);
        return {
          id,
          name: `Подписка #${id}`,
          sub,
        };
      });
      await Promise.all(selectedIds.map((id) => subscriptionsApi.delete(id)));
      const notifications = targets
        .map((target) => {
          if (!target.sub) return null;
          const userId = getRefId(target.sub.user);
          const botId = getRefId(target.sub.bot);
          const planId = getRefId(target.sub.plan);
          if (!userId || !botId || !planId) return null;
          return apiClient.post('/send_purchase_notification/', {
            user_id: userId,
            bot_id: botId,
            plan_id: planId,
            language: getUserLanguage(userId),
            message_identifier: 'subscription_expired',
          });
        })
        .filter(Boolean) as Array<Promise<unknown>>;
      if (notifications.length) {
        try {
          await Promise.all(notifications);
        } catch (error) {
          let details = '';
          if (axios.isAxiosError(error)) {
            const data = error.response?.data as
              | Record<string, unknown>
              | string
              | undefined;
            if (typeof data === 'string') {
              details = data;
            } else if (data && typeof data === 'object') {
              details = Object.entries(data)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(' | ');
            }
          }
          toast({
            title: 'Уведомления не отправлены',
            description: details || 'Не удалось отправить уведомления о подписках',
            variant: 'destructive',
          });
        }
      }
      targets.forEach((target) =>
        logRecentAction({
          entityType: 'subscription',
          entityId: target.id,
          entityName: target.name,
          action: 'delete',
        })
      );
      toast({ title: 'Успешно', description: 'Подписки удалены' });
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранные подписки',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkOpen(false);
    }
  };

  const getRefId = (value: SubscriptionRef): number | null => {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'object') return null;
    if (typeof value.telegram_id === 'number') return value.telegram_id;
    if (typeof value.id === 'number') return value.id;
    return null;
  };

  const getUserLanguage = (userId: number | null) => {
    if (!userId) return 'ru';
    const user = users.find(
      (item) =>
        Number(item.telegram_id) === userId ||
        (typeof item.id === 'number' && Number(item.id) === userId)
    );
    return user?.language || 'ru';
  };

  const getRefLabel = (value: SubscriptionRef): string => {
    if (typeof value === 'number') return String(value);
    if (!value || typeof value !== 'object') return '—';
    return (
      value.username ||
      value.title ||
      value.name ||
      (value.telegram_id ? String(value.telegram_id) : '') ||
      (value.id ? String(value.id) : '') ||
      '—'
    );
  };

  const botsMap = useMemo(() => {
    const map = new Map<number, string>();
    bots.forEach((bot) => map.set(Number(bot.id), bot.title));
    return map;
  }, [bots]);

  const plansMap = useMemo(() => {
    const map = new Map<number, string>();
    plans.forEach((plan) => map.set(Number(plan.id), plan.name));
    return map;
  }, [plans]);

  const usersMap = useMemo(() => {
    const map = new Map<number, string>();
    users.forEach((user) => {
      const label = String(user.telegram_id ?? user.id ?? '');
      if (user.id) {
        map.set(Number(user.id), label);
      }
      if (user.telegram_id) {
        map.set(Number(user.telegram_id), label);
      }
    });
    return map;
  }, [users]);

  const filtered = data.filter((sub) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getRefLabel(sub.user).toLowerCase().includes(q) ||
      getRefLabel(sub.bot).toLowerCase().includes(q) ||
      getRefLabel(sub.plan).toLowerCase().includes(q)
    );
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return format(date, 'dd MMM yyyy, HH:mm', { locale: ru });
  };

  const columns = [
    {
      key: 'user',
      header: 'USER',
      cell: (sub: Subscription) => (
        <p className="font-medium">
          {(() => {
            const id = getRefId(sub.user);
            return (id ? usersMap.get(id) : null) || getRefLabel(sub.user);
          })()}
        </p>
      ),
    },
    {
      key: 'bot',
      header: 'BOT',
      cell: (sub: Subscription) => {
        const id = getRefId(sub.bot);
        return (id ? botsMap.get(id) : null) || getRefLabel(sub.bot);
      },
    },
    {
      key: 'plan',
      header: 'PLAN',
      cell: (sub: Subscription) => {
        const id = getRefId(sub.plan);
        return (id ? plansMap.get(id) : null) || getRefLabel(sub.plan);
      },
    },
    {
      key: 'start_date',
      header: 'START DATE',
      cell: (sub: Subscription) => formatDateTime(sub.start_date),
    },
    {
      key: 'end_date',
      header: 'END DATE',
      cell: (sub: Subscription) => formatDateTime(sub.end_date),
    },
    {
      key: 'is_active',
      header: 'IS ACTIVE',
      cell: (sub: Subscription) => (
        <StatusBadge
          status={sub.is_active ? 'active' : 'inactive'}
          label={sub.is_active ? 'Активна' : 'Неактивна'}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'CREATED AT',
      cell: (sub: Subscription) => formatDateTime(sub.created_at || sub.start_date),
    },
    {
      key: 'actions',
      header: '',
      cell: (sub: Subscription) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/subscriptions/${sub.id}/edit`)}
          onDelete={() => setDeleteId(sub.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Подписки</h1>
          <p className="text-muted-foreground">Управление подписками пользователей</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setBulkOpen(true)}>
              Удалить выбранные ({selectedIds.length})
            </Button>
          )}
        <Button onClick={() => navigate('/admin/subscriptions/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить подписку
        </Button>
        </div>
      </div>

      <Card className="glass">
        <CardContent className="p-6">
          <div className="mb-4">
            <DataTableSearch
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Поиск..."
              showFilterButton={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={paginated}
            isLoading={isLoading}
            onRowClick={(sub) => navigate(`/admin/subscriptions/${sub.id}/edit`)}
            selectable
            selectedKeys={selectedIds}
            onSelectedKeysChange={setSelectedIds}
            rowKey={(sub) => String(sub.id)}
            emptyMessage="Подписки не найдены"
          />

          {totalPages > 1 && (
            <DataTablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Удалить подписку?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Удалить ${selectedIds.length} подписок?`}
        description="Это действие нельзя отменить. Подписки будут удалены безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default SubscriptionsPage;
