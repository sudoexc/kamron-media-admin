import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/table/DataTable';
import { DataTableSearch } from '@/components/table/DataTableSearch';
import { DataTableActions } from '@/components/table/DataTableActions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { botsApi } from '@/api/entities';
import { Bot } from '@/types/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const BotsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const bots = await botsApi.getAll();
      const sorted = [...bots].sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : NaN;
        const bTime = b.created_at ? Date.parse(b.created_at) : NaN;
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
  }, [toast]);

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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => botsApi.delete(id)));
      toast({ title: 'Успешно', description: 'Боты удалены' });
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранные боты',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkOpen(false);
    }
  };

  const filtered = data.filter((bot) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      bot.title.toLowerCase().includes(q) ||
      bot.username.toLowerCase().includes(q) ||
      String(bot.notification_group_id).includes(q)
    );
  });

  const columns = [
    {
      key: 'title',
      header: 'Название',
      cell: (bot: Bot) => (
        <div>
          <p className="font-medium">{bot.title}</p>
          <p className="text-sm text-muted-foreground">{bot.username}</p>
        </div>
      ),
    },
    {
      key: 'notification_group_id',
      header: 'ID группы уведомлений',
      cell: (bot: Bot) => bot.notification_group_id,
    },
    {
      key: 'request_port',
      header: 'Порт',
      cell: (bot: Bot) => bot.request_port,
    },
    {
      key: 'created_at',
      header: 'Создан',
      cell: (bot: Bot) =>
        bot.created_at
          ? format(new Date(bot.created_at), 'dd MMM yyyy', { locale: ru })
          : '—',
    },
    {
      key: 'actions',
      header: '',
      cell: (bot: Bot) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/bots/${bot.id}/edit`)}
          onDelete={() => setDeleteId(String(bot.id))}
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
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setBulkOpen(true)}>
              Удалить выбранные ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => navigate('/admin/bots/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить бота
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
              }}
              placeholder="Поиск по названию..."
              showFilterButton={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            onRowClick={(bot) => navigate(`/admin/bots/${bot.id}/edit`)}
            selectable
            selectedKeys={selectedIds}
            onSelectedKeysChange={setSelectedIds}
            rowKey={(bot) => String(bot.id)}
            emptyMessage="Боты не найдены"
          />
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

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Удалить ${selectedIds.length} ботов?`}
        description="Это действие нельзя отменить. Боты будут удалены безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default BotsPage;
