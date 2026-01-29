import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paymentsApi } from '@/api/entities';
import { Payment } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';

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

const SubscriptionsReportPage: React.FC = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [appliedRange, setAppliedRange] = useState<{ from?: string; to?: string }>({});

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await paymentsApi.getAll({
        page: 1,
        limit: 1000,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setPayments(response.data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить платежи',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const applyRange = () => {
    setAppliedRange({
      from: fromInput || undefined,
      to: toInput || undefined,
    });
  };

  const filteredPayments = useMemo(() => {
    const from = appliedRange.from ? new Date(appliedRange.from) : null;
    const to = appliedRange.to ? new Date(appliedRange.to) : null;
    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    return payments
      .filter((p) => (p.status?.toLowerCase?.() ?? '') === 'success')
      .filter((p) => {
        const created = new Date(p.created_at ?? '');
        if (from && created < from) return false;
        if (to && created > to) return false;
        return true;
      });
  }, [payments, appliedRange]);

  const totalCount = filteredPayments.length;
  const totalAmount = filteredPayments.reduce((sum, p) => {
    const amount = Number((p.amount || '').replace(',', '.'));
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const aggregate = useCallback(
    (key: 'method' | 'bot') => {
      const result: { name: string; count: number; sum: number }[] = [];
      const map = new Map<string, { count: number; sum: number }>();

      filteredPayments.forEach((payment) => {
        const rawKey = (() => {
          if (key === 'method') {
            const raw = payment.method ?? '';
            const methodKey = normalizeMethodKey(String(raw));
            return methodLabels[methodKey] || raw || 'Не указан';
          }
          const bot = payment.bot;
          if (typeof bot === 'number') return `#${bot}`;
          if (bot && typeof bot === 'object') {
            return bot.title || bot.username || `#${bot.id ?? '—'}`;
          }
          return 'Без бота';
        })();
        const amount = Number((payment.amount || '').replace(',', '.'));
        const current = map.get(rawKey) || { count: 0, sum: 0 };
        current.count += 1;
        current.sum += Number.isFinite(amount) ? amount : 0;
        map.set(rawKey, current);
      });

      map.forEach((value, name) => {
        result.push({ name, ...value });
      });

      return result.sort((a, b) => b.sum - a.sum);
    },
    [filteredPayments]
  );

  const methodStats = useMemo(() => aggregate('method'), [aggregate]);
  const botStats = useMemo(() => aggregate('bot'), [aggregate]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('ru-RU').format(value);

  const handleExport = () => {
    const downloadReport = async () => {
      try {
        const params: Record<string, string> = {};
        if (appliedRange.from) params.from = appliedRange.from;
        if (appliedRange.to) params.to = appliedRange.to;
        const response = await apiClient.get('/reports/payments/', {
          params,
          responseType: 'blob',
        });
        const contentDisposition = response.headers?.['content-disposition'] as
          | string
          | undefined;
        const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
        const filename =
          filenameMatch?.[1] ||
          `payments_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        const blob = new Blob([response.data], {
          type: response.headers?.['content-type'] || 'application/octet-stream',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);

        toast({ title: 'Экспорт', description: 'Файл сохранён' });
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось скачать отчёт',
          variant: 'destructive',
        });
      }
    };

    downloadReport();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Отчёты по подпискам</h1>
            <p className="text-sm text-muted-foreground">
              Фильтр по датам, статистика, выгрузка в Excel
            </p>
          </div>
        </div>
      </div>

      <Card className="glass">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">С даты</label>
            <Input
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              placeholder="дд.мм.гггг"
              className="w-48"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">По дату</label>
            <Input
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              placeholder="дд.мм.гггг"
              className="w-48"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button onClick={applyRange} disabled={isLoading}>
              Показать
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isLoading || filteredPayments.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="p-6 space-y-3">
          <h2 className="text-xl font-semibold">Общая статистика</h2>
          <ul className="list-disc pl-5 space-y-1 text-lg">
            <li>Всего платежей: {formatNumber(totalCount)}</li>
            <li>Общая сумма: {formatNumber(totalAmount)}</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">По методам оплаты</h2>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Метод</TableHead>
                  <TableHead className="w-1/4">Количество</TableHead>
                  <TableHead className="w-1/4">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={3}>Загрузка...</TableCell>
                  </TableRow>
                )}
                {!isLoading && methodStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>Данных нет</TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  methodStats.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium capitalize">{row.name}</TableCell>
                      <TableCell>{formatNumber(row.count)}</TableCell>
                      <TableCell>{formatNumber(row.sum)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">По ботам</h2>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Бот</TableHead>
                  <TableHead className="w-1/4">Количество</TableHead>
                  <TableHead className="w-1/4">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={3}>Загрузка...</TableCell>
                  </TableRow>
                )}
                {!isLoading && botStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>Данных нет</TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  botStats.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{formatNumber(row.count)}</TableCell>
                      <TableCell>{formatNumber(row.sum)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionsReportPage;
