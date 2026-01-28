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

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
  moderator: 'Модератор',
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

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await usersApi.delete(deleteId);
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

  const columns = [
    {
      key: 'name',
      header: 'Имя',
      cell: (user: User) => (
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Телефон',
      cell: (user: User) => user.phone,
    },
    {
      key: 'role',
      header: 'Роль',
      cell: (user: User) => (
        <StatusBadge
          status={user.role}
          label={roleLabels[user.role]}
          type={user.role === 'admin' ? 'info' : 'default'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Регистрация',
      cell: (user: User) =>
        format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ru }),
    },
    {
      key: 'actions',
      header: '',
      cell: (user: User) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/users/${user.id}/edit`)}
          onDelete={() => setDeleteId(user.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Пользователи</h1>
          <p className="text-muted-foreground">Управление пользователями системы</p>
        </div>
        <Button onClick={() => navigate('/admin/users/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить пользователя
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
              placeholder="Поиск по имени или email..."
              showFilterButton={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            rowKey={(user) => user.id}
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
    </div>
  );
};

export default UsersPage;
