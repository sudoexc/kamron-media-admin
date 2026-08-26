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
import { usersApi } from '@/api/entities';
import { User } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logRecentAction } from '@/lib/recent-actions';

const languageLabels: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  uz: 'O‘zbek',
};

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<User[]>([]);
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
      const response = await usersApi.getAll({ page, limit, search });
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

  useEffect(() => {
    setSelectedIds([]);
  }, [data]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const target = data.find((user) => String(user.telegram_id) === deleteId);
      await usersApi.delete(deleteId);
      logRecentAction({
        entityType: 'user',
        entityId: deleteId,
        entityName: target
          ? `Пользователь ${target.telegram_id}`
          : `Пользователь ${deleteId}`,
        action: 'delete',
      });
      toast({ title: 'Успешно', description: 'Пользователь удалён' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить пользователя',
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
        const user = data.find((item) => String(item.telegram_id) === id);
        return {
          id,
          name: user ? `Пользователь ${user.telegram_id}` : `Пользователь ${id}`,
        };
      });
      await Promise.all(selectedIds.map((id) => usersApi.delete(id)));
      targets.forEach((target) =>
        logRecentAction({
          entityType: 'user',
          entityId: target.id,
          entityName: target.name,
          action: 'delete',
        })
      );
      toast({ title: 'Успешно', description: 'Пользователи удалены' });
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранных пользователей',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkOpen(false);
    }
  };

  const columns = [
    {
      key: 'telegram_id',
      header: 'Telegram ID',
      cell: (user: User) => <p className="font-medium">{user.telegram_id}</p>,
    },
    {
      key: 'language',
      header: 'Язык',
      cell: (user: User) => languageLabels[user.language] || user.language,
    },
    {
      key: 'is_active',
      header: 'Активен',
      cell: (user: User) => (
        <StatusBadge
          status={user.is_active ? 'active' : 'inactive'}
          label={user.is_active ? 'Активен' : 'Неактивен'}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Создан',
      cell: (user: User) =>
        user.created_at
          ? format(new Date(user.created_at), 'dd MMM yyyy', { locale: ru })
          : '—',
    },
    {
      key: 'actions',
      header: '',
      cell: (user: User) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/users/${user.telegram_id}/edit`)}
          onDelete={() => setDeleteId(String(user.telegram_id))}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Пользователи</h1>
          <p className="text-muted-foreground">Управление пользователями Telegram</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setBulkOpen(true)}>
              Удалить выбранные ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => navigate('/admin/users/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить пользователя
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
              placeholder="Поиск по Telegram ID..."
              showFilterButton={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            onRowClick={(user) => navigate(`/admin/users/${user.telegram_id}/edit`)}
            selectable
            selectedKeys={selectedIds}
            onSelectedKeysChange={setSelectedIds}
            rowKey={(user) => String(user.telegram_id)}
            emptyMessage="Пользователи не найдены"
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
        title="Удалить пользователя?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Удалить ${selectedIds.length} пользователей?`}
        description="Это действие нельзя отменить. Пользователи будут удалены безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default UsersPage;
