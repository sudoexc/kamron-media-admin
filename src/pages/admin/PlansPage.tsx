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
import { plansApi } from '@/api/entities';
import { SubscriptionPlan } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<SubscriptionPlan[]>([]);
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
      const response = await plansApi.getAll({ page, limit, search });
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
      await plansApi.delete(deleteId);
      toast({ title: 'Успешно', description: 'Тариф удалён' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить тариф',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      key: 'title',
      header: 'Название',
      cell: (plan: SubscriptionPlan) => (
        <p className="font-medium">{plan.title}</p>
      ),
    },
    {
      key: 'price',
      header: 'Цена',
      cell: (plan: SubscriptionPlan) => (
        <p className="font-semibold">{formatCurrency(plan.price)}</p>
      ),
    },
    {
      key: 'period',
      header: 'Период',
      cell: (plan: SubscriptionPlan) => `${plan.periodDays} дней`,
    },
    {
      key: 'isActive',
      header: 'Статус',
      cell: (plan: SubscriptionPlan) => (
        <StatusBadge
          status={plan.isActive ? 'active' : 'inactive'}
          label={plan.isActive ? 'Активен' : 'Неактивен'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Создан',
      cell: (plan: SubscriptionPlan) =>
        format(new Date(plan.createdAt), 'dd MMM yyyy', { locale: ru }),
    },
    {
      key: 'actions',
      header: '',
      cell: (plan: SubscriptionPlan) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/subscription-plans/${plan.id}/edit`)}
          onDelete={() => setDeleteId(plan.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Тарифные планы</h1>
          <p className="text-muted-foreground">Управление тарифами подписок</p>
        </div>
        <Button onClick={() => navigate('/admin/subscription-plans/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить тариф
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
              placeholder="Поиск по названию..."
              showFilterButton={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            rowKey={(plan) => plan.id}
            emptyMessage="Тарифы не найдены"
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
        title="Удалить тариф?"
        description="Это действие нельзя отменить. Тариф будет удалён безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default PlansPage;
