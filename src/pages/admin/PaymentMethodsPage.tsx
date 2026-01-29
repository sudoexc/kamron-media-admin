import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/table/DataTable';
import { DataTableSearch } from '@/components/table/DataTableSearch';
import { DataTablePagination } from '@/components/table/DataTablePagination';
import { DataTableActions } from '@/components/table/DataTableActions';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { paymentMethodsApi } from '@/api/entities';
import { PaymentMethod } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logRecentAction } from '@/lib/recent-actions';

const PaymentMethodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  type NormalizedMethod = PaymentMethod & {
    id: string | number;
    label: string;
    isActive?: boolean;
    createdAt?: string;
  };
  const [data, setData] = useState<NormalizedMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await paymentMethodsApi.getAll({ page, limit, search });
      const normalized = (response.data as Array<PaymentMethod | string>).map(
        (method, index) => {
          if (typeof method === 'string') {
            return {
              id: method,
              title: method,
              label: method,
            };
          }

          const label = method.title || method.name || `Метод ${index + 1}`;
          const id =
            method.id ||
            method.name ||
            method.title ||
            String(index + 1);
          return {
            ...method,
            id,
            label,
            isActive: method.is_active ?? method.isActive,
            createdAt: method.created_at ?? method.createdAt,
          };
        }
      );
      const sorted = [...normalized].sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : NaN;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : NaN;
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
      setData(sorted);
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

  useEffect(() => {
    setSelectedIds([]);
  }, [data]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const target = data.find((method) => String(method.id) === deleteId);
      await paymentMethodsApi.delete(deleteId);
      logRecentAction({
        entityType: 'payment_method',
        entityId: deleteId,
        entityName: target?.label || `Метод #${deleteId}`,
        action: 'delete',
      });
      toast({ title: 'Успешно', description: 'Способ оплаты удалён' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить способ оплаты',
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
        const method = data.find((item) => String(item.id) === id);
        return { id, name: method?.label || `Метод #${id}` };
      });
      await Promise.all(selectedIds.map((id) => paymentMethodsApi.delete(id)));
      targets.forEach((target) =>
        logRecentAction({
          entityType: 'payment_method',
          entityId: target.id,
          entityName: target.name,
          action: 'delete',
        })
      );
      toast({ title: 'Успешно', description: 'Способы оплаты удалены' });
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранные способы оплаты',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkOpen(false);
    }
  };

  const setUpdating = (id: string, active: boolean) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      if (active) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleToggleActive = async (method: NormalizedMethod, nextValue: boolean) => {
    if (method.isActive === undefined) return;
    const id = String(method.id);
    setUpdating(id, true);
    try {
      await paymentMethodsApi.update(method.id, { is_active: nextValue });
      setData((prev) =>
        prev.map((item) =>
          String(item.id) === id ? { ...item, isActive: nextValue } : item
        )
      );
      logRecentAction({
        entityType: 'payment_method',
        entityId: id,
        entityName: method.label || `Метод #${id}`,
        action: 'edit',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус способа оплаты',
        variant: 'destructive',
      });
    } finally {
      setUpdating(id, false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Название',
      cell: (method: NormalizedMethod) => (
        <p className="font-medium">{method.label}</p>
      ),
    },
    {
      key: 'isActive',
      header: 'Активность',
      cell: (method: NormalizedMethod) => {
        const active = method.isActive;
        if (active === undefined) return '—';
        const id = String(method.id);
        return (
          <div
            className="flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <Switch
              checked={active}
              onCheckedChange={(checked) => handleToggleActive(method, checked)}
              disabled={updatingIds.has(id)}
            />
            <span className="text-sm text-muted-foreground">
              {active ? 'Вкл' : 'Выкл'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Создан',
      cell: (method: NormalizedMethod) =>
        method.createdAt
          ? format(new Date(method.createdAt), 'dd MMM yyyy', { locale: ru })
          : '—',
    },
    {
      key: 'actions',
      header: '',
      cell: (method: NormalizedMethod) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/payment-methods/${method.id}/edit`)}
          onDelete={() => setDeleteId(String(method.id))}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Способы оплаты</h1>
          <p className="text-muted-foreground">Управление способами оплаты</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setBulkOpen(true)}>
              Удалить выбранные ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => navigate('/admin/payment-methods/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить способ
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
            data={data}
            isLoading={isLoading}
            onRowClick={(method) =>
              navigate(`/admin/payment-methods/${String(method.id)}/edit`)
            }
            selectable
            selectedKeys={selectedIds}
            onSelectedKeysChange={setSelectedIds}
            rowKey={(method) => String(method.id)}
            emptyMessage="Способы оплаты не найдены"
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
        title="Удалить способ оплаты?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Удалить ${selectedIds.length} способов?`}
        description="Это действие нельзя отменить. Способы оплаты будут удалены безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default PaymentMethodsPage;
