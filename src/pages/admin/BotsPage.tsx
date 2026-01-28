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
import { botsApi } from '@/api/entities';
import { Bot } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const statusLabels: Record<string, string> = {
  active: 'Активен',
  inactive: 'Неактивен',
  suspended: 'Приостановлен',
};

const BotsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Bot[]>([]);
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
      const response = await botsApi.getAll({ page, limit, search });
      setData(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch bots:', error);
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
      await botsApi.delete(deleteId);
      toast({ title: 'Успешно', description: 'Бот удалён' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить бота',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Название',
      cell: (bot: Bot) => (
        <div>
          <p className="font-medium">{bot.name}</p>
          <p className="text-sm text-muted-foreground">{bot.username}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      cell: (bot: Bot) => (
        <StatusBadge status={bot.status} label={statusLabels[bot.status]} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Создан',
      cell: (bot: Bot) =>
        format(new Date(bot.createdAt), 'dd MMM yyyy', { locale: ru }),
    },
    {
      key: 'actions',
      header: '',
      cell: (bot: Bot) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/bots/${bot.id}/edit`)}
          onDelete={() => setDeleteId(bot.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Боты</h1>
          <p className="text-muted-foreground">Управление ботами системы</p>
        </div>
        <Button onClick={() => navigate('/admin/bots/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить бота
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
            rowKey={(bot) => bot.id}
            emptyMessage="Боты не найдены"
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
        title="Удалить бота?"
        description="Это действие нельзя отменить. Бот будет удалён безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default BotsPage;
