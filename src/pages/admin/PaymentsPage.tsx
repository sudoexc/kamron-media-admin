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
import { paymentsApi } from '@/api/entities';
import { Payment } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const statusLabels: Record<string, string> = {
  pending: 'В обработке',
  completed: 'Выполнен',
  failed: 'Ошибка',
  refunded: 'Возврат',
};

const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Payment[]>([]);
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
      const response = await paymentsApi.getAll({ page, limit, search });
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
      await paymentsApi.delete(deleteId);
      toast({ title: 'Успешно', description: 'Платёж удалён' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить платёж',
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
      key: 'id',
      header: 'ID',
      cell: (payment: Payment) => (
        <span className="text-muted-foreground">#{payment.id}</span>
      ),
    },
    {
      key: 'user',
      header: 'Пользователь',
      cell: (payment: Payment) => (
        <p className="font-medium">{payment.userName || `ID: ${payment.userId}`}</p>
      ),
    },
    {
      key: 'amount',
      header: 'Сумма',
      cell: (payment: Payment) => (
        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
      ),
    },
    {
      key: 'method',
      header: 'Способ',
      cell: (payment: Payment) => payment.method.toUpperCase(),
    },
    {
      key: 'status',
      header: 'Статус',
      cell: (payment: Payment) => (
        <StatusBadge status={payment.status} label={statusLabels[payment.status]} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Дата',
      cell: (payment: Payment) =>
        format(new Date(payment.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru }),
    },
    {
      key: 'actions',
      header: '',
      cell: (payment: Payment) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/payments/${payment.id}/edit`)}
          onDelete={() => setDeleteId(payment.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Платежи</h1>
          <p className="text-muted-foreground">История платежей</p>
        </div>
        <Button onClick={() => navigate('/admin/payments/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить платёж
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
            rowKey={(payment) => payment.id}
            emptyMessage="Платежи не найдены"
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
        title="Удалить платёж?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default PaymentsPage;
