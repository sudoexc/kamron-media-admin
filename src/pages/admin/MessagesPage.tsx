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
import { messagesApi } from '@/api/entities';
import { Message } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const statusLabels: Record<string, string> = {
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Ошибка',
};

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Message[]>([]);
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
      const response = await messagesApi.getAll({ page, limit, search });
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
      await messagesApi.delete(deleteId);
      toast({ title: 'Успешно', description: 'Сообщение удалено' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить сообщение',
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
      cell: (msg: Message) => (
        <p className="font-medium">{msg.userName || `ID: ${msg.userId}`}</p>
      ),
    },
    {
      key: 'text',
      header: 'Текст',
      cell: (msg: Message) => (
        <p className="max-w-xs truncate">{msg.text}</p>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      cell: (msg: Message) => (
        <StatusBadge status={msg.status} label={statusLabels[msg.status]} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Дата',
      cell: (msg: Message) =>
        format(new Date(msg.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru }),
    },
    {
      key: 'actions',
      header: '',
      cell: (msg: Message) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/messages/${msg.id}/edit`)}
          onDelete={() => setDeleteId(msg.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Сообщения</h1>
          <p className="text-muted-foreground">Просмотр сообщений пользователей</p>
        </div>
        <Button onClick={() => navigate('/admin/messages/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить сообщение
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
            rowKey={(msg) => msg.id}
            emptyMessage="Сообщения не найдены"
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
        title="Удалить сообщение?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default MessagesPage;
