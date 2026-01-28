import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/table/DataTable';
import { DataTableSearch } from '@/components/table/DataTableSearch';
import { DataTablePagination } from '@/components/table/DataTablePagination';
import { StatusBadge } from '@/components/ui/status-badge';
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

const SubscriptionsReportPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;

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

  const handleExport = () => {
    // Create CSV content
    const headers = ['ID', 'Пользователь', 'Тариф', 'Начало', 'Окончание', 'Статус'];
    const rows = data.map((sub) => [
      sub.id,
      sub.userName || sub.userId,
      sub.planTitle || sub.planId,
      format(new Date(sub.startAt), 'dd.MM.yyyy'),
      format(new Date(sub.endAt), 'dd.MM.yyyy'),
      statusLabels[sub.status],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subscriptions_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({ title: 'Экспорт', description: 'Отчёт успешно экспортирован' });
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      cell: (sub: Subscription) => (
        <span className="text-muted-foreground">#{sub.id}</span>
      ),
    },
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
      key: 'startAt',
      header: 'Начало',
      cell: (sub: Subscription) =>
        format(new Date(sub.startAt), 'dd MMM yyyy', { locale: ru }),
    },
    {
      key: 'endAt',
      header: 'Окончание',
      cell: (sub: Subscription) =>
        format(new Date(sub.endAt), 'dd MMM yyyy', { locale: ru }),
    },
    {
      key: 'status',
      header: 'Статус',
      cell: (sub: Subscription) => (
        <StatusBadge status={sub.status} label={statusLabels[sub.status]} />
      ),
    },
  ];

  // Summary stats
  const activeCount = data.filter((s) => s.status === 'active').length;
  const expiredCount = data.filter((s) => s.status === 'expired').length;
  const cancelledCount = data.filter((s) => s.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Отчёт по подпискам</h1>
          <p className="text-muted-foreground">Аналитика и экспорт данных о подписках</p>
        </div>
        <Button onClick={handleExport} disabled={data.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Экспорт CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активные
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Истёкшие
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{expiredCount}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Отменённые
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{cancelledCount}</p>
          </CardContent>
        </Card>
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
    </div>
  );
};

export default SubscriptionsReportPage;
