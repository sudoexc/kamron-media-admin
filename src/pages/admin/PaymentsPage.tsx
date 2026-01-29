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
  success: 'Успешно',
  failed: 'Ошибка',
};

const methodLabels: Record<string, string> = {
  payme: 'PayMe',
  click: 'Click',
  crypto: 'CryptoBot',
  stars: 'Telegram Stars',
  russian_card: 'Russian Card',
  stub: 'Stub',
};

const normalizeMethodKey = (value: string) => {
  const raw = value.toLowerCase();
  const cleaned = raw
    .replace(/[^a-z0-9_\s]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^_+|_+$/g, '')
    .trim();
  const key = cleaned.replace(/\s+/g, '_');
  const map: Record<string, string> = {
    payme: 'payme',
    click: 'click',
    crypto: 'crypto',
    cryptobot: 'crypto',
    stars: 'stars',
    telegramstars: 'stars',
    telegram_stars: 'stars',
    'telegram stars': 'stars',
    russian_card: 'russian_card',
    russiancard: 'russian_card',
    'russian card': 'russian_card',
    stub: 'stub',
  };
  return map[key] ?? key;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await paymentsApi.getAll({ page, limit, search });
      const sorted = [...response.data].sort((a, b) => {
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => paymentsApi.delete(id)));
      toast({ title: 'Успешно', description: 'Платежи удалены' });
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранные платежи',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkOpen(false);
    }
  };

  const getPaymentCreatedAt = (payment: Payment): string | null => {
    if (payment.created_at) return payment.created_at;
    return null;
  };

  const parseAmount = (value: string): number => {
    const normalized = value.replace(',', '.');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  };

  const formatAmount = (value: string): string => {
    const amount = parseAmount(value);
    if (!Number.isFinite(amount) || value === '') return value;
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getUserLabel = (payment: Payment): string => {
    const user = payment.user;
    if (typeof user === 'number') return `ID: ${user}`;
    if (user && typeof user === 'object') {
      if (typeof user.telegram_id === 'number') return `${user.telegram_id}`;
      if (typeof user.id === 'number') return `ID: ${user.id}`;
    }
    return '—';
  };

  const getBotLabel = (payment: Payment): string => {
    const bot = payment.bot;
    if (typeof bot === 'number') return `#${bot}`;
    if (bot && typeof bot === 'object') {
      const title = bot.title || '';
      const username = bot.username ? `(${bot.username})` : '';
      return `${title} ${username}`.trim() || `#${bot.id}`;
    }
    return '—';
  };

  const getPlanLabel = (payment: Payment): string => {
    const subscription = payment.subscription;
    if (!subscription) return '—';
    if (typeof subscription === 'number') return `#${subscription}`;
    if (typeof subscription === 'object') {
      if (typeof subscription.plan === 'number') return `#${subscription.plan}`;
      if (subscription.plan && typeof subscription.plan === 'object') {
        const plan = subscription.plan;
        if (typeof plan.name === 'string') return plan.name;
        if (typeof plan.id === 'number') return `#${plan.id}`;
      }
      if (typeof subscription.id === 'number') return `#${subscription.id}`;
    }
    return '—';
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
        <p className="font-medium">{getUserLabel(payment)}</p>
      ),
    },
    {
      key: 'bot',
      header: 'Бот',
      cell: (payment: Payment) => <p>{getBotLabel(payment)}</p>,
    },
    {
      key: 'plan',
      header: 'План',
      cell: (payment: Payment) => <p>{getPlanLabel(payment)}</p>,
    },
    {
      key: 'amount',
      header: 'Сумма',
      cell: (payment: Payment) => (
        <p className="font-semibold">{formatAmount(payment.amount)}</p>
      ),
    },
    {
      key: 'method',
      header: 'Метод',
      cell: (payment: Payment) => {
        const raw = payment.method ?? '';
        const key = normalizeMethodKey(String(raw));
        return methodLabels[key] || raw;
      },
    },
    {
      key: 'status',
      header: 'Статус',
      cell: (payment: Payment) => {
        const statusKey = payment.status?.toLowerCase?.() ?? payment.status;
        return (
          <StatusBadge
            status={payment.status}
            label={statusLabels[statusKey] || payment.status}
          />
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Дата',
      cell: (payment: Payment) => {
        const createdAt = getPaymentCreatedAt(payment);
        return createdAt
          ? format(new Date(createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })
          : '—';
      },
    },
    {
      key: 'actions',
      header: '',
      cell: (payment: Payment) => (
        <DataTableActions
          onEdit={() => navigate(`/admin/payments/${payment.id}/edit`)}
          onDelete={() => setDeleteId(String(payment.id))}
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
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setBulkOpen(true)}>
              Удалить выбранные ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => navigate('/admin/payments/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить платёж
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
              placeholder="Поиск..."
              showFilterButton={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            onRowClick={(payment) => navigate(`/admin/payments/${payment.id}/edit`)}
            selectable
            selectedKeys={selectedIds}
            onSelectedKeysChange={setSelectedIds}
            rowKey={(payment) => String(payment.id)}
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

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Удалить ${selectedIds.length} платежей?`}
        description="Это действие нельзя отменить. Платежи будут удалены безвозвратно."
        confirmLabel="Удалить"
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default PaymentsPage;
