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
import { paymentMethodsApi } from '@/api/entities';
import { PaymentMethod } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const PaymentMethodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  type NormalizedMethod = PaymentMethod & {
    id: string | number;
    label: string;
    codeLabel?: string;
    isActive?: boolean;
    createdAt?: string;
  };
  const [data, setData] = useState<NormalizedMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

          const label =
            method.title ||
            method.name ||
            method.code ||
            method.provider ||
            `Метод ${index + 1}`;
          const id =
            method.id ||
            method.code ||
            method.name ||
            method.title ||
            method.provider ||
            String(index + 1);
          return {
            ...method,
            id,
            label,
            codeLabel: method.code || method.provider || '',
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
      await paymentMethodsApi.delete(deleteId);
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
      await Promise.all(selectedIds.map((id) => paymentMethodsApi.delete(id)));
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

  const columns = [
    {
      key: 'title',
      header: 'Название',
      cell: (method: NormalizedMethod) => (
        <p className="font-medium">{method.label}</p>
      ),
    },
    {
      key: 'code',
      header: 'Код',
      cell: (method: NormalizedMethod) =>
        method.codeLabel ? method.codeLabel.toUpperCase() : '—',
    },
    {
      key: 'isActive',
      header: 'Статус',
      cell: (method: NormalizedMethod) => {
        const active = method.isActive;
        return (
          <StatusBadge
            status={
              active === undefined ? 'default' : active ? 'active' : 'inactive'
            }
            label={active === undefined ? '—' : active ? 'Активен' : 'Неактивен'}
          />
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
