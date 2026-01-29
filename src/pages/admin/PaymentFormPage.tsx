import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import {
  paymentsApi,
  usersApi,
  botsApi,
  subscriptionsApi,
  paymentMethodsApi,
} from '@/api/entities';
import { Bot, PaymentMethod, Subscription, User } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import { logRecentAction } from '@/lib/recent-actions';
import axios from 'axios';

const paymentSchema = z.object({
  user: z.preprocess(
    (val) => Number(val),
    z
      .number({ required_error: 'Выберите пользователя' })
      .int('Только целое число')
      .min(1, 'Выберите пользователя')
  ),
  bot: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: 'Выберите бота' }).int('Только целое число').min(1, 'Выберите бота')
  ),
  subscription: z.preprocess(
    (val) => {
      const num = Number(val);
      return Number.isNaN(num) || num === 0 ? null : num;
    },
    z.number().int().nullable().optional()
  ),
  method: z.string().min(1, 'Выберите метод'),
  amount: z.string().min(1, 'Введите сумму'),
  status: z.string().min(1, 'Выберите статус'),
  transaction_id: z.string().optional().nullable(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const statusOptions = [
  { value: 'success', label: 'Успешно' },
  { value: 'pending', label: 'В обработке' },
  { value: 'failed', label: 'Ошибка' },
];

const methodLabelMap: Record<string, string> = {
  payme: 'PayMe',
  click: 'Click',
  crypto: 'CryptoBot',
  stars: 'Telegram Stars',
  russian_card: 'Russian Card',
  stub: 'Stub',
};

const normalizeMethodValue = (value: string) => {
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

const PaymentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [users, setUsers] = useState<User[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [methods, setMethods] = useState<Array<PaymentMethod | string>>([]);
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      user: 0,
      bot: 0,
      subscription: null,
      method: '',
      amount: '',
      status: 'success',
      transaction_id: '',
    },
  });

  const selectedUser = watch('user');
  const selectedBot = watch('bot');
  const selectedSubscription = watch('subscription') ?? 0;
  const selectedMethod = watch('method');
  const selectedStatus = watch('status');

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        id: Number(user.telegram_id),
        label: `${user.telegram_id ?? user.id} (${user.language})`,
      })),
    [users]
  );

  const botOptions = useMemo(
    () =>
      bots.map((bot) => ({
        id: Number(bot.id),
        label: `${bot.title} (${bot.username})`,
      })),
    [bots]
  );

  const subscriptionOptions = useMemo(
    () =>
      subscriptions.map((subscription) => {
        const userId =
          typeof subscription.user === 'number'
            ? subscription.user
            : subscription.user?.telegram_id ?? subscription.user?.id ?? '—';
        const planId =
          typeof subscription.plan === 'number'
            ? subscription.plan
            : subscription.plan?.name ?? subscription.plan?.id ?? '—';
        return {
          id: Number(subscription.id),
          label: `#${subscription.id} • user ${userId} • plan ${planId}`,
        };
      }),
    [subscriptions]
  );

  const methodOptions = useMemo(() => {
    const raw = methods.length
      ? (methods as Array<PaymentMethod | string>).map((method, index) => {
          if (typeof method === 'string') {
            const normalized = normalizeMethodValue(method);
            return {
              value: normalized,
              label: methodLabelMap[normalized] || method,
            };
          }
          const rawValue =
            method.code ||
            method.name ||
            method.title ||
            method.provider ||
            String(method.id ?? index + 1);
          const normalized = normalizeMethodValue(String(rawValue));
          const label =
            method.title ||
            method.name ||
            method.code ||
            method.provider ||
            methodLabelMap[normalized] ||
            normalized;
          return { value: normalized, label };
        })
      : Object.entries(methodLabelMap).map(([value, label]) => ({
          value,
          label,
        }));

    return raw;
  }, [methods]);

  const getUserId = (value: User | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value.telegram_id === 'number') return value.telegram_id;
    if (typeof value.id === 'number') return value.id;
    return 0;
  };

  const getBotId = (value: Bot | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value.id === 'number') return value.id;
    return 0;
  };

  const getSubscriptionId = (value?: Subscription | number | null): number | null => {
    if (!value) return null;
    if (typeof value === 'number') return value;
    if (typeof value.id === 'number') return value.id;
    return null;
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [usersResponse, botsResponse, subscriptionsResponse, methodsResponse] =
          await Promise.all([
            usersApi.getAll(),
            botsApi.getAll(),
            subscriptionsApi.getAll(),
            paymentMethodsApi.getAll({ page: 1, limit: 200 }),
          ]);
        setUsers(usersResponse);
        setBots(botsResponse);
        setSubscriptions(subscriptionsResponse);
        setMethods(methodsResponse.data as Array<PaymentMethod | string>);
      } catch {
        setUsers([]);
        setBots([]);
        setSubscriptions([]);
        setMethods([]);
      }
    };

    const loadPayment = async () => {
      if (!id) {
        setIsFetching(false);
        return;
      }
      try {
        const payment = await paymentsApi.getById(id);
        setValue('user', getUserId(payment.user));
        setValue('bot', getBotId(payment.bot));
        setValue('subscription', getSubscriptionId(payment.subscription));
        setValue('method', payment.method || '');
        setValue('amount', payment.amount || '');
        setValue('status', payment.status || 'success');
        setValue('transaction_id', payment.transaction_id || '');
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить платёж',
          variant: 'destructive',
        });
        navigate('/admin/payments');
      } finally {
        setIsFetching(false);
      }
    };

    loadOptions();
    loadPayment();
  }, [id, navigate, setValue, toast]);

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    try {
      const amountNumber = Number(String(data.amount).replace(',', '.'));
      const payload = {
        user_id: data.user,
        bot_id: data.bot,
        method: normalizeMethodValue(data.method),
        amount: Number.isFinite(amountNumber) ? amountNumber : 0,
        status: data.status.toLowerCase(),
        ...(data.subscription ? { subscription_id: data.subscription } : {}),
      };

      if (isEdit) {
        const updated = await paymentsApi.update(id!, payload);
        logRecentAction({
          entityType: 'payment',
          entityId: String(updated.id),
          entityName: `Платёж #${updated.id}`,
          action: 'edit',
        });
        toast({ title: 'Успешно', description: 'Платёж обновлён' });
      } else {
        const created = await paymentsApi.create(payload);
        logRecentAction({
          entityType: 'payment',
          entityId: String(created.id),
          entityName: `Платёж #${created.id}`,
          action: 'create',
        });
        toast({ title: 'Успешно', description: 'Платёж создан' });
      }
      navigate('/admin/payments');
    } catch (error) {
      let details = '';
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | Record<string, unknown>
          | string
          | undefined;
        if (typeof data === 'string') {
          details = data;
        } else if (data && typeof data === 'object') {
          details = Object.entries(data)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(' | ');
        }
      }
      toast({
        title: 'Ошибка',
        description: details
          ? details
          : isEdit
            ? 'Не удалось обновить платёж'
            : 'Не удалось создать платёж',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/payments')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Редактировать платёж' : 'Добавить платёж'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Измените данные платежа' : 'Заполните данные нового платежа'}
          </p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Данные платежа</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Пользователь</Label>
              <Select
                value={selectedUser ? String(selectedUser) : ''}
                onValueChange={(value) => setValue('user', Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {userOptions.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user && (
                <p className="text-sm text-destructive">
                  {errors.user.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot">Бот</Label>
              <Select
                value={selectedBot ? String(selectedBot) : ''}
                onValueChange={(value) => setValue('bot', Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите бота" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {botOptions.map((bot) => (
                    <SelectItem key={bot.id} value={String(bot.id)}>
                      {bot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bot && (
                <p className="text-sm text-destructive">
                  {errors.bot.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription">Подписка (необязательно)</Label>
              <Select
                value={selectedSubscription ? String(selectedSubscription) : '0'}
                onValueChange={(value) => setValue('subscription', Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите подписку" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="0">Не выбрано</SelectItem>
                  {subscriptionOptions.map((subscription) => (
                    <SelectItem key={subscription.id} value={String(subscription.id)}>
                      {subscription.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subscription && (
                <p className="text-sm text-destructive">
                  {errors.subscription.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Метод оплаты</Label>
              <Select
                value={selectedMethod}
                onValueChange={(value) => setValue('method', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите метод" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {methodOptions.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.method && (
                <p className="text-sm text-destructive">
                  {errors.method.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Сумма</Label>
              <Input
                id="amount"
                {...register('amount')}
                disabled={isLoading}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">
                  {errors.status.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_id">Transaction ID (необязательно)</Label>
              <Input
                id="transaction_id"
                placeholder="TXN-123"
                {...register('transaction_id')}
                disabled={isLoading}
              />
              {errors.transaction_id && (
                <p className="text-sm text-destructive">
                  {errors.transaction_id.message as string}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : isEdit ? (
                'Сохранить изменения'
              ) : (
                'Создать платёж'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFormPage;
