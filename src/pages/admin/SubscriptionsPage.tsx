import React, { useState, useEffect, useCallback } from 'react';
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
import { subscriptionsApi } from '@/api/entities';
import { Subscription } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const statusLabels: Record<string, string> = {
  active: 'Активна',
  expired: 'Истекла',
  cancelled: 'Отменена',
};

const SubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await subscriptionsApi.getAll({ page, limit, search });
      setData(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await subscriptionsApi.delete(deleteId);
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

  const columns = [
    {
      key: 'user',
      header: 'Пользователь',
      cell: (sub: Subscription) => (
        <p className="font-medium">{sub.userName || `ID: ${sub.userId}`}</p>
      ),
    },
    {
      key: 'plan',
      header: 'Тариф',
      cell: (sub: Subscription) => sub.planTitle || sub.planId,
    },
    {
      key: 'period',
      header: 'Период',
      cell: (sub: Subscription) => (
        <span className="text-sm">
          {format(new Date(sub.startAt), 'dd.MM.yy', { locale: ru })} —{' '}
          {format(new Date(sub.endAt), 'dd.MM.yy', { locale: ru })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      cell: (sub: Subscription) => (
        <StatusBadge status={sub.status} label={statusLabels[sub.status]} />
      ),
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
        <Button onClick={() => navigate('/admin/subscriptions/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить подписку
        </Button>
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
            data={data}
            isLoading={isLoading}
            rowKey={(sub) => sub.id}
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
    </div>
  );
};

export default SubscriptionsPage;
