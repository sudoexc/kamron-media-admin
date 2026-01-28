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
import { groupsApi } from '@/api/entities';
import { Group } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Group[]>([]);
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
      const response = await groupsApi.getAll({ page, limit, search });
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
      await groupsApi.delete(deleteId);
      toast({ title: 'Успешно', description: 'Группа удалена' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить группу',
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
      cell: (group: Group) => (
        <p className="font-medium">{group.name}</p>
      ),
    },
    {
      key: 'permissions',
      header: 'Разрешений',
      cell: (group: Group) => group.permissionsCount,
    },
    {
      key: 'createdAt',
      header: 'Создана',
      cell: (group: Group) =>
        format(new Date(group.createdAt), 'dd MMM yyyy', { locale: ru }),
    },
    {
      key: 'actions',
      header: '',
      cell: (group: Group) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/groups/${group.id}/edit`)}
          onDelete={() => setDeleteId(group.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Группы</h1>
          <p className="text-muted-foreground">Управление группами пользователей</p>
        </div>
        <Button onClick={() => navigate('/admin/groups/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить группу
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
            rowKey={(group) => group.id}
            emptyMessage="Группы не найдены"
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
        title="Удалить группу?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default GroupsPage;
