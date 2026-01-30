import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { subscriptionsApi, usersApi, botsApi, plansApi } from '@/api/entities';
import { apiClient } from '@/api/client';
import { Subscription, User, Bot, SubscriptionPlan, SubscriptionRef } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { logRecentAction } from '@/lib/recent-actions';

const subscriptionSchema = z.object({
  user: z.preprocess(
    (val) => Number(val),
    z
      .number({ required_error: 'Выберите пользователя' })
      .int('Только целое число')
      .min(1, 'Выберите пользователя')
  ),
  bot: z.preprocess(
    (val) => Number(val),
    z
      .number({ required_error: 'Выберите бота' })
      .int('Только целое число')
      .min(1, 'Выберите бота')
  ),
  plan: z.preprocess(
    (val) => Number(val),
    z
      .number({ required_error: 'Выберите план' })
      .int('Только целое число')
      .min(1, 'Выберите план')
  ),
  is_active: z.boolean(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

const SubscriptionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      user: 0,
      bot: 0,
      plan: 0,
      is_active: true,
    },
  });

  const isActive = watch('is_active');
  const selectedUser = watch('user');
  const selectedBot = watch('bot');
  const selectedPlan = watch('plan');
  const [initialPlanId, setInitialPlanId] = useState<number | null>(null);
  const [existingDates, setExistingDates] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const getRefId = (value: SubscriptionRef): number | null => {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'object') return null;
    if (typeof value.telegram_id === 'number') return value.telegram_id;
    if (typeof value.id === 'number') return value.id;
    return null;
  };

  const getUserLanguage = (userId: number) => {
    const user = users.find(
      (item) =>
        Number(item.telegram_id) === userId ||
        (typeof item.id === 'number' && Number(item.id) === userId)
    );
    return user?.language || 'ru';
  };

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

  const planOptions = useMemo(
    () =>
      plans.map((plan) => ({
        id: Number(plan.id),
        label: `${plan.name} (${plan.duration_days} дн.)`,
        duration: plan.duration_days,
        name: plan.name,
      })),
    [plans]
  );

  const isLifetimePlan = useMemo(() => {
    const plan = planOptions.find((option) => option.id === selectedPlan);
    if (!plan) return false;
    const duration = Number(plan.duration);
    const name = String(plan.name || '').toLowerCase();
    return (
      duration === 0 ||
      name.includes('навсегда') ||
      name.includes('forever') ||
      name.includes('lifetime')
    );
  }, [planOptions, selectedPlan]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [usersResponse, botsResponse, plansResponse] = await Promise.all([
          usersApi.getAll(),
          botsApi.getAll(),
          plansApi.getAll(),
        ]);
        setUsers(usersResponse);
        setBots(botsResponse);
        setPlans(plansResponse);
      } catch {
        setUsers([]);
        setBots([]);
        setPlans([]);
      }
    };

    const loadSubscription = async () => {
      if (!id) {
        setIsFetching(false);
        return;
      }
      try {
        const subscription = await subscriptionsApi.getById(id);
        if (subscription) {
          const planId = getRefId(subscription.plan) || 0;
          setValue('user', getRefId(subscription.user) || 0);
          setValue('bot', getRefId(subscription.bot) || 0);
          setValue('plan', planId);
          setInitialPlanId(planId || null);
          setValue('is_active', subscription.is_active);
          setExistingDates({
            start: subscription.start_date || null,
            end: subscription.end_date ?? null,
          });
        }
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить подписку',
          variant: 'destructive',
        });
        navigate('/admin/subscriptions');
      } finally {
        setIsFetching(false);
      }
    };

    loadOptions();
    loadSubscription();
  }, [id, navigate, setValue, toast]);

  const pad = (value: number) => String(value).padStart(2, '0');

  const getCurrentTimeString = () => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const buildDateTimeString = (date: string, time: string) => `${date} ${time}`;

  const buildDateTimeObject = (date: string, time: string) =>
    new Date(`${date}T${time}`);

  const formatLocalDateTime = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  const onSubmit = async (data: SubscriptionFormData) => {
    setIsLoading(true);
    try {
      const currentTime = getCurrentTimeString();
      const today = new Date();
      const todayDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
        today.getDate()
      )}`;
      let startAt = buildDateTimeString(todayDate, currentTime);
      let endAt: string | null = null;

      const duration =
        planOptions.find((option) => option.id === data.plan)?.duration ?? null;

      if (!isLifetimePlan && duration && !Number.isNaN(duration)) {
        const startDate = buildDateTimeObject(todayDate, currentTime);
        if (!Number.isNaN(startDate.getTime())) {
          const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
          endAt = formatLocalDateTime(endDate);
        }
      }

      if (isEdit && initialPlanId && initialPlanId === data.plan) {
        // Do not shift dates when plan unchanged.
        if (existingDates.start) {
          startAt = existingDates.start;
        }
        if (existingDates.end) {
          endAt = existingDates.end;
        } else if (isLifetimePlan) {
          endAt = null;
        }
      }

      const payload: Omit<Subscription, 'id' | 'created_at'> = {
        user: data.user,
        bot: data.bot,
        plan: data.plan,
        start_date: startAt,
        is_active: data.is_active,
      };
      if (!isLifetimePlan) {
        payload.end_date = endAt;
      }

      if (isEdit) {
        const updated = await subscriptionsApi.update(id!, payload);
        logRecentAction({
          entityType: 'subscription',
          entityId: String(updated.id),
          entityName: `Подписка #${updated.id}`,
          action: 'edit',
        });
        toast({ title: 'Успешно', description: 'Подписка обновлена' });
      } else {
        const created = await subscriptionsApi.create(payload);
        logRecentAction({
          entityType: 'subscription',
          entityId: String(created.id),
          entityName: `Подписка #${created.id}`,
          action: 'create',
        });
        try {
          await apiClient.post('/send_purchase_notification/', {
            user_id: data.user,
            bot_id: data.bot,
            plan_id: data.plan,
            language: getUserLanguage(data.user),
            message_identifier: 'subscription_purchased',
          });
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
            title: 'Уведомление не отправлено',
            description: details || 'Не удалось отправить уведомление о покупке',
            variant: 'destructive',
          });
        }
        toast({ title: 'Успешно', description: 'Подписка создана' });
      }
      navigate('/admin/subscriptions');
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
            ? 'Не удалось обновить подписку'
            : 'Не удалось создать подписку',
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/subscriptions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Редактировать Подписку' : 'Добавить Подписку'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Измените данные подписки' : 'Заполните данные новой подписки'}
          </p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Данные подписки</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select
                value={selectedUser ? String(selectedUser) : ''}
                onValueChange={(value) => setValue('user', Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {userOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user && (
                <p className="text-sm text-destructive">{errors.user.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot">Bot</Label>
              <Select
                value={selectedBot ? String(selectedBot) : ''}
                onValueChange={(value) => setValue('bot', Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите бота" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {botOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bot && (
                <p className="text-sm text-destructive">{errors.bot.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={selectedPlan ? String(selectedPlan) : ''}
                onValueChange={(value) => setValue('plan', Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите план" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {planOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.plan && (
                <p className="text-sm text-destructive">{errors.plan.message as string}</p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="is_active">Is active</Label>
                <p className="text-sm text-muted-foreground">
                  Подписка будет активна
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/subscriptions')}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionFormPage;
