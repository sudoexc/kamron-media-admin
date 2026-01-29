import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/table/DataTable';
import { DataTableSearch } from '@/components/table/DataTableSearch';
import { DataTablePagination } from '@/components/table/DataTablePagination';
import { DataTableActions } from '@/components/table/DataTableActions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { messagesApi } from '@/api/entities';
import { Message } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await messagesApi.getAll({ page, limit, search });
      const sorted = [...response.data].sort((a, b) => {
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => messagesApi.delete(id)));
      toast({ title: 'Успешно', description: 'Сообщения удалены' });
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранные сообщения',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkOpen(false);
    }
  };

  const columns = [
    {
      key: 'identifier',
      header: 'Идентификатор',
      cell: (msg: Message) => (
        <p className="font-medium">{msg.identifier}</p>
      ),
    },
    {
      key: 'message_ru',
      header: 'Сообщение (RU)',
      cell: (msg: Message) => (
        <p className="max-w-xs truncate">{msg.message_ru}</p>
      ),
    },
    {
      key: 'message_en',
      header: 'Сообщение (EN)',
      cell: (msg: Message) => (
        <p className="max-w-xs truncate">{msg.message_en}</p>
      ),
    },
    {
      key: 'message_uz',
      header: 'Сообщение (UZ)',
      cell: (msg: Message) => (
        <p className="max-w-xs truncate">{msg.message_uz}</p>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (msg: Message) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/messages/${msg.id}/edit`)}
          onDelete={() => setDeleteId(String(msg.id))}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Сообщения</h1>
          <p className="text-muted-foreground">Шаблоны уведомлений</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setBulkOpen(true)}>
              Удалить выбранные ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => navigate('/admin/messages/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить сообщение
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
              placeholder="Поиск по идентификатору или тексту..."
              showFilterButton={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            onRowClick={(message) => navigate(`/admin/messages/${message.id}/edit`)}
            selectable
            selectedKeys={selectedIds}
            onSelectedKeysChange={setSelectedIds}
            rowKey={(msg) => String(msg.id)}
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

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Удалить ${selectedIds.length} сообщений?`}
        description="Это действие нельзя отменить. Сообщения будут удалены безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default MessagesPage;
