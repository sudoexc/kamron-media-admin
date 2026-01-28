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
  const [data, setData] = useState<PaymentMethod[]>([]);
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
      const response = await paymentMethodsApi.getAll({ page, limit, search });
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

  const columns = [
    {
      key: 'title',
      header: 'Название',
      cell: (method: PaymentMethod) => (
        <p className="font-medium">{method.title}</p>
      ),
    },
    {
      key: 'provider',
      header: 'Провайдер',
      cell: (method: PaymentMethod) => method.provider.toUpperCase(),
    },
    {
      key: 'isActive',
      header: 'Статус',
      cell: (method: PaymentMethod) => (
        <StatusBadge
          status={method.isActive ? 'active' : 'inactive'}
          label={method.isActive ? 'Активен' : 'Неактивен'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Создан',
      cell: (method: PaymentMethod) =>
        format(new Date(method.createdAt), 'dd MMM yyyy', { locale: ru }),
    },
    {
      key: 'actions',
      header: '',
      cell: (method: PaymentMethod) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/payment-methods/${method.id}/edit`)}
          onDelete={() => setDeleteId(method.id)}
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
        <Button onClick={() => navigate('/admin/payment-methods/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить способ
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
            rowKey={(method) => method.id}
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
    </div>
  );
};

export default PaymentMethodsPage;
