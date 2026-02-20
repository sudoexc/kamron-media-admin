import React, { useCallback, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, Users, RefreshCw, Download, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { statisticsApi, GrowthPeriod, GrowthChartPoint, DailyStatsSnapshot } from '@/api/statistics';
import { useToast } from '@/hooks/use-toast';

const PERIODS: { value: GrowthPeriod; label: string }[] = [
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: '3m', label: '3 месяца' },
  { value: '1y', label: '1 год' },
  { value: 'custom', label: 'Период' },
];

const LANG_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  uz__lotin: 'O\'zbekcha (lotin)',
  uz__kiril: 'Ўзбекча (кирил)',
};

const StatisticsPage: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<GrowthPeriod>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [history, setHistory] = useState<GrowthChartPoint[]>([]);
  const [latest, setLatest] = useState<DailyStatsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async (p: GrowthPeriod, from?: string, to?: string) => {
    setIsLoading(true);
    try {
      const [histData, latestData] = await Promise.all([
        statisticsApi.getHistory(p, from, to),
        statisticsApi.getLatestSnapshot(),
      ]);
      setHistory(histData);
      setLatest(latestData);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить статистику', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (period !== 'custom') {
      fetchAll(period);
    }
  }, [period, fetchAll]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value as GrowthPeriod);
  };

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) {
      toast({ title: 'Укажите период', description: 'Заполните обе даты', variant: 'destructive' });
      return;
    }
    fetchAll('custom', customFrom, customTo);
  };

  const handleRefresh = () => {
    if (period === 'custom') {
      handleApplyCustom();
    } else {
      fetchAll(period);
    }
  };

  // Language breakdown for bar chart from latest snapshot
  const langData = latest
    ? Object.entries(LANG_LABELS).map(([key, label]) => ({
        lang: label,
        users: latest.users[key as keyof typeof latest.users] ?? 0,
        groups: latest.groups[key as keyof typeof latest.groups] ?? 0,
      }))
    : [];

  const totalNewInPeriod = history.reduce((s, d) => s + d.newUsers, 0);
  const totalNewGroupsInPeriod = history.reduce((s, d) => s + d.newGroups, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Статистика роста</h1>
          <p className="text-sm text-muted-foreground">
            Данные обновляются каждый день в 04:58 по Ташкенту
          </p>
        </div>
      </div>

      {/* Current snapshot summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Всего пользователей</p>
            <p className="text-2xl font-bold">{latest ? latest.total.toLocaleString('ru-RU') : '—'}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Новых сегодня</p>
            <p className="text-2xl font-bold text-green-500">
              {latest ? `+${latest.new_users.toLocaleString('ru-RU')}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Новых групп</p>
            <p className="text-2xl font-bold text-blue-500">
              {latest ? `+${latest.new_groups.toLocaleString('ru-RU')}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" /> Premium
            </p>
            <p className="text-2xl font-bold text-yellow-500">
              {latest ? latest.premium_users.toLocaleString('ru-RU') : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Shield className="h-3 w-3 text-red-500" /> Заблокировали
            </p>
            <p className="text-2xl font-bold text-red-500">
              {latest ? latest.blocked_users.toLocaleString('ru-RU') : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Загрузок</p>
            <p className="text-2xl font-bold">
              {latest ? latest.downloads.toLocaleString('ru-RU') : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period filter */}
      <Card className="glass">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <Tabs value={period} onValueChange={handlePeriodChange}>
            <TabsList>
              {PERIODS.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {period === 'custom' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">С даты</label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">По дату</label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-44"
                />
              </div>
              <Button onClick={handleApplyCustom} disabled={isLoading}>
                Показать
              </Button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              За период: <span className="font-semibold text-foreground">+{totalNewInPeriod.toLocaleString('ru-RU')} польз.</span>{' '}
              / <span className="font-semibold text-foreground">+{totalNewGroupsInPeriod.toLocaleString('ru-RU')} групп</span>
            </span>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Growth chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Рост пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Нет данных за выбранный период
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 13 }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString('ru-RU'),
                    name === 'total' ? 'Всего' : name === 'newUsers' ? 'Новых' : name,
                  ]}
                />
                <Legend formatter={(v) => (v === 'total' ? 'Всего пользователей' : v === 'newUsers' ? 'Новых пользователей' : v)} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#totalGrad)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="newUsers" stroke="#22c55e" strokeWidth={2} fill="url(#newGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* New users vs new groups bar chart */}
      {history.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Новые пользователи и группы по дням</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={history} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 13 }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString('ru-RU'),
                    name === 'newUsers' ? 'Новых пользователей' : 'Новых групп',
                  ]}
                />
                <Legend formatter={(v) => (v === 'newUsers' ? 'Новых пользователей' : 'Новых групп')} />
                <Bar dataKey="newUsers" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="newGroups" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Language breakdown */}
      {latest && langData.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Разбивка по языкам (сейчас)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={langData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <YAxis type="category" dataKey="lang" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 13 }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString('ru-RU'),
                    name === 'users' ? 'Пользователей' : 'Групп',
                  ]}
                />
                <Legend formatter={(v) => (v === 'users' ? 'Пользователей' : 'Групп')} />
                <Bar dataKey="users" fill="#22c55e" radius={[0, 3, 3, 0]} />
                <Bar dataKey="groups" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatisticsPage;
