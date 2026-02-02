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
import { logRecentAction } from '@/lib/recent-actions';

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<SubscriptionPlan[]>([]);
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
      const [plansResponse] = await Promise.all([plansApi.getAll()]);
      const sortedPlans = [...plansResponse].sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : NaN;
        const bTime = b.created_at ? Date.parse(b.created_at) : NaN;
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
      setData(sortedPlans);
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
      const target = data.find((plan) => String(plan.id) === deleteId);
      await plansApi.delete(deleteId);
      logRecentAction({
        entityType: 'plan',
        entityId: deleteId,
        entityName: target?.name || `План #${deleteId}`,
        action: 'delete',
      });
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const targets = selectedIds.map((id) => {
        const plan = data.find((item) => String(item.id) === id);
        return { id, name: plan?.name || `План #${id}` };
      });
      await Promise.all(selectedIds.map((id) => plansApi.delete(id)));
      targets.forEach((target) =>
        logRecentAction({
          entityType: 'plan',
          entityId: target.id,
          entityName: target.name,
          action: 'delete',
        })
      );
      toast({ title: 'Успешно', description: 'Планы удалены' });
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранные планы',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkOpen(false);
    }
  };

  const formatCurrency = (value: number, currency: string): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: string): string => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return value;
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(parsed);
  };

  const filtered = data.filter((plan) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      plan.name.toLowerCase().includes(q) ||
      String(plan.duration_days).includes(q)
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

  const columns = [
    {
      key: 'name',
      header: 'Название',
      cell: (plan: SubscriptionPlan) => (
        <p className="font-medium">{plan.name}</p>
      ),
    },
    {
      key: 'prices',
      header: 'Цены',
      cell: (plan: SubscriptionPlan) => (
        <div className="text-sm space-y-1">
          <div>USDT: {formatNumber(plan.price_usdt)}</div>
          <div>UZS: {formatNumber(plan.price_uzs)}</div>
          <div>STARS: {formatNumber(plan.price_stars)}</div>
          <div>RUB: {formatCurrency(Number(plan.price_rub), 'RUB')}</div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Длительность',
      cell: (plan: SubscriptionPlan) => `${plan.duration_days} дней`,
    },
    {
      key: 'is_active',
      header: 'Статус',
      cell: (plan: SubscriptionPlan) => (
        <StatusBadge
          status={plan.is_active ? 'active' : 'inactive'}
          label={plan.is_active ? 'Активен' : 'Неактивен'}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Создан',
      cell: (plan: SubscriptionPlan) =>
        plan.created_at
          ? format(new Date(plan.created_at), 'dd MMM yyyy', { locale: ru })
          : '—',
    },
    {
      key: 'actions',
      header: '',
      cell: (plan: SubscriptionPlan) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/subscription-plans/${plan.id}/edit`)}
          onDelete={() => setDeleteId(String(plan.id))}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Планы подписок</h1>
          <p className="text-muted-foreground">Управление планами подписок</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setBulkOpen(true)}>
              Удалить выбранные ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => navigate('/admin/subscription-plans/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить план
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
              placeholder="Поиск по названию или длительности..."
              showFilterButton={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={paginated}
            isLoading={isLoading}
            onRowClick={(plan) => navigate(`/admin/subscription-plans/${plan.id}/edit`)}
            selectable
            selectedKeys={selectedIds}
            onSelectedKeysChange={setSelectedIds}
            rowKey={(plan) => String(plan.id)}
            emptyMessage="Планы не найдены"
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
        title="Удалить план?"
        description="Это действие нельзя отменить. План будет удалён безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Удалить ${selectedIds.length} планов?`}
        description="Это действие нельзя отменить. Планы будут удалены безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default PlansPage;
