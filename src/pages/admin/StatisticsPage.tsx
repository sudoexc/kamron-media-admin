import React, { useCallback, useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar,
} from 'recharts';
import { TrendingUp, Users, RefreshCw, Shield, Star, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  statisticsApi, GrowthPeriod, GrowthChartPoint, DailyStatsSnapshot, BotSnapshot,
} from '@/api/statistics';
import { useToast } from '@/hooks/use-toast';

const PERIODS: { value: GrowthPeriod; label: string }[] = [
  { value: '7d',    label: '7 дней' },
  { value: '30d',   label: '30 дней' },
  { value: '3m',    label: '3 месяца' },
  { value: '1y',    label: '1 год' },
  { value: 'custom',label: 'Период' },
];

const LANG_LABELS: Record<string, string> = {
  ru:        'Русский',
  en:        'English',
  uz__lotin: "O'zbekcha (lotin)",
  uz__kiril: 'Ўзбекча (кирил)',
};

const ALL_BOTS = 'all';

const StatisticsPage: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<GrowthPeriod>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [history, setHistory] = useState<GrowthChartPoint[]>([]);
  const [latest, setLatest] = useState<DailyStatsSnapshot | null>(null);
  const [selectedBotPort, setSelectedBotPort] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async (p: GrowthPeriod, from?: string, to?: string, botPort?: number) => {
    setIsLoading(true);
    try {
      const [histData, latestData] = await Promise.all([
        statisticsApi.getHistory(p, from, to, botPort),
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
    if (period !== 'custom') fetchAll(period, undefined, undefined, selectedBotPort);
  }, [period, selectedBotPort, fetchAll]);

  const handlePeriodChange = (value: string) => setPeriod(value as GrowthPeriod);

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) {
      toast({ title: 'Укажите период', description: 'Заполните обе даты', variant: 'destructive' });
      return;
    }
    fetchAll('custom', customFrom, customTo, selectedBotPort);
  };

  const handleRefresh = () => {
    if (period === 'custom') handleApplyCustom();
    else fetchAll(period, undefined, undefined, selectedBotPort);
  };

  const handleBotChange = (value: string) => {
    const p = value === ALL_BOTS ? undefined : Number(value);
    setSelectedBotPort(p);
  };

  // Current stats — either selected bot or aggregate
  const currentStats: DailyStatsSnapshot | null = (() => {
    if (!latest) return null;
    if (!selectedBotPort || !latest.bots) return latest;
    const bot = latest.bots.find((b) => b.port === selectedBotPort);
    return bot ? { ...bot.stats, date: latest.date, bots: latest.bots } : latest;
  })();

  const bots: BotSnapshot[] = latest?.bots ?? [];

  const langData = currentStats
    ? Object.entries(LANG_LABELS).map(([key, label]) => ({
        lang: label,
        users:  currentStats.users?.[key  as keyof typeof currentStats.users]  ?? 0,
        groups: currentStats.groups?.[key as keyof typeof currentStats.groups] ?? 0,
      }))
    : [];

  const totalNewInPeriod      = history.reduce((s, d) => s + d.newUsers,  0);
  const totalNewGroupsInPeriod = history.reduce((s, d) => s + d.newGroups, 0);

  const fmt = (n: number) => n.toLocaleString('ru-RU');
  const fmtAxis = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Статистика роста</h1>
            <p className="text-sm text-muted-foreground">
              Данные обновляются каждый день в 04:55 по Ташкенту
            </p>
          </div>
        </div>

        {/* Bot selector */}
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedBotPort ? String(selectedBotPort) : ALL_BOTS} onValueChange={handleBotChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Все боты" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BOTS}>Все боты</SelectItem>
              {bots.map((b) => (
                <SelectItem key={b.port} value={String(b.port)}>
                  {b.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Всего пользователей</p>
            <p className="text-2xl font-bold">{currentStats ? fmt(currentStats.total) : '—'}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Новых сегодня</p>
            <p className="text-2xl font-bold text-green-500">
              {currentStats ? `+${fmt(currentStats.new_users)}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Новых групп</p>
            <p className="text-2xl font-bold text-blue-500">
              {currentStats ? `+${fmt(currentStats.new_groups)}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" /> Premium
            </p>
            <p className="text-2xl font-bold text-yellow-500">
              {currentStats ? fmt(currentStats.premium_users) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Shield className="h-3 w-3 text-red-500" /> Заблокировали
            </p>
            <p className="text-2xl font-bold text-red-500">
              {currentStats ? fmt(currentStats.blocked_users) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Загрузок</p>
            <p className="text-2xl font-bold">{currentStats ? fmt(currentStats.downloads) : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Period filter */}
      <Card className="glass">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <Tabs value={period} onValueChange={handlePeriodChange}>
            <TabsList>
              {PERIODS.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {period === 'custom' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">С даты</label>
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-44" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">По дату</label>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-44" />
              </div>
              <Button onClick={handleApplyCustom} disabled={isLoading}>Показать</Button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              За период:{' '}
              <span className="font-semibold text-foreground">+{fmt(totalNewInPeriod)} польз.</span>
              {' / '}
              <span className="font-semibold text-foreground">+{fmt(totalNewGroupsInPeriod)} групп</span>
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
            {selectedBotPort && bots.find((b) => b.port === selectedBotPort) && (
              <span className="text-muted-foreground font-normal">
                — {bots.find((b) => b.port === selectedBotPort)?.title}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Нет данных за выбранный период
            </div>
          ) : history.length === 1 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-center">
              <p className="text-muted-foreground">Сегодня собран первый снапшот — <span className="font-semibold text-foreground">{fmt(history[0].total)}</span> пользователей</p>
              <p className="text-sm text-muted-foreground">График роста появится завтра, когда накопится хотя бы 2 дня данных</p>
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
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={55} tickFormatter={fmtAxis} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 13 }}
                  formatter={(value: number, name: string) => [fmt(value), name === 'total' ? 'Всего' : 'Новых']}
                />
                <Legend formatter={(v) => (v === 'total' ? 'Всего пользователей' : 'Новых пользователей')} />
                <Area type="monotone" dataKey="total"    stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#totalGrad)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="newUsers" stroke="#22c55e"             strokeWidth={2} fill="url(#newGrad)"   dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bar chart: new users vs groups */}
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
                  formatter={(value: number, name: string) => [fmt(value), name === 'newUsers' ? 'Новых пользователей' : 'Новых групп']}
                />
                <Legend formatter={(v) => (v === 'newUsers' ? 'Новых пользователей' : 'Новых групп')} />
                <Bar dataKey="newUsers"  fill="#22c55e"             radius={[3, 3, 0, 0]} />
                <Bar dataKey="newGroups" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Language breakdown */}
      {currentStats && langData.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Разбивка по языкам (сейчас)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={langData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={fmt} />
                <YAxis type="category" dataKey="lang" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 13 }}
                  formatter={(value: number, name: string) => [fmt(value), name === 'users' ? 'Пользователей' : 'Групп']}
                />
                <Legend formatter={(v) => (v === 'users' ? 'Пользователей' : 'Групп')} />
                <Bar dataKey="users"  fill="#22c55e"             radius={[0, 3, 3, 0]} />
                <Bar dataKey="groups" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-bot comparison table */}
      {!selectedBotPort && bots.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4" />
              По ботам
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Бот</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Всего</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Новых</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Premium</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Заблок.</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Загрузок</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.map((b) => (
                    <tr
                      key={b.port}
                      className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedBotPort(b.port)}
                    >
                      <td className="p-3 font-medium">{b.title}</td>
                      <td className="p-3 text-right">{fmt(b.stats.total)}</td>
                      <td className="p-3 text-right text-green-500">+{fmt(b.stats.new_users)}</td>
                      <td className="p-3 text-right text-yellow-500">{fmt(b.stats.premium_users)}</td>
                      <td className="p-3 text-right text-red-500">{fmt(b.stats.blocked_users)}</td>
                      <td className="p-3 text-right">{fmt(b.stats.downloads)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatisticsPage;
