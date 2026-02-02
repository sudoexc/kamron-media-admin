import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { botsApi, botPlansApi, plansApi } from '@/api/entities';
import { Bot, SubscriptionPlan } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import { logRecentAction } from '@/lib/recent-actions';

const numberFromInput = (message: string) =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || typeof val === 'undefined') return undefined;
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return Number(val);
    },
    z.number({ required_error: message }).int('Только целое число')
  );

const optionalNumberFromInput = () =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || typeof val === 'undefined') return undefined;
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return Number(val);
    },
    z.number().int('Только целое число').optional()
  );

const optionalStringFromInput = () =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || typeof val === 'undefined') return undefined;
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return val;
    },
    z.string().min(1, 'Введите токен бота').optional()
  );

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const isPlanRecord = (record: Record<string, unknown>): boolean =>
  'name' in record ||
  'duration_days' in record ||
  'price_usdt' in record ||
  'price_uzs' in record ||
  'price_rub' in record ||
  'price_stars' in record;

const getPlanIdFromRecord = (record: Record<string, unknown>): number | null => {
  const planCandidate = record.plan_id ?? record.planId ?? record.plan;
  if (planCandidate && typeof planCandidate === 'object') {
    const nested = planCandidate as Record<string, unknown>;
    const nestedId = nested.plan_id ?? nested.planId ?? nested.id;
    const parsedNested = toNumber(nestedId);
    if (parsedNested && parsedNested > 0) return parsedNested;
  }
  const parsedPlanCandidate = toNumber(planCandidate);
  if (parsedPlanCandidate && parsedPlanCandidate > 0) return parsedPlanCandidate;

  if (isPlanRecord(record)) {
    const parsedId = toNumber(record.id);
    if (parsedId && parsedId > 0) return parsedId;
  }
  return null;
};

const getLinkIdFromRecord = (
  record: Record<string, unknown>
): string | number | null => {
  const candidates = [record.link_id, record.linkId, record.id];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      if (candidate === '') continue;
      return candidate;
    }
  }
  return null;
};

const extractPlanIds = (payload: unknown): number[] => {
  if (!payload) return [];

  const extractFromArray = (items: unknown[]) =>
    items
      .map((item) => {
        if (item && typeof item === 'object') {
          return getPlanIdFromRecord(item as Record<string, unknown>);
        }
        return toNumber(item);
      })
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0);

  if (Array.isArray(payload)) {
    return Array.from(new Set(extractFromArray(payload)));
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const arrays = [record.plans, record.results, record.data];
    for (const value of arrays) {
      if (Array.isArray(value)) {
        return Array.from(new Set(extractFromArray(value)));
      }
    }
    const single = getPlanIdFromRecord(record);
    return single ? [single] : [];
  }

  return [];
};

const extractPlanLinks = (
  payload: unknown
): Array<{ linkId: string | number; planId: number }> => {
  if (!payload) return [];

  const extractFromArray = (items: unknown[]) =>
    items
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const planId = getPlanIdFromRecord(record);
        const linkId = getLinkIdFromRecord(record);
        if (!planId || !linkId) return null;
        return { linkId, planId };
      })
      .filter(
        (
          item
        ): item is {
          linkId: string | number;
          planId: number;
        } => !!item
      );

  if (Array.isArray(payload)) {
    return extractFromArray(payload);
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const arrays = [record.results, record.data, record.plans];
    for (const value of arrays) {
      if (Array.isArray(value)) {
        return extractFromArray(value);
      }
    }
    const planId = getPlanIdFromRecord(record);
    const linkId = getLinkIdFromRecord(record);
    if (planId && linkId) return [{ linkId, planId }];
  }

  return [];
};

const botSchema = z.object({
  title: z.string().min(1, 'Введите название').max(100),
  username: z.string().min(1, 'Введите username').max(50),
  notification_group_id: optionalNumberFromInput(),
  bot_token: optionalStringFromInput(),
  request_port: optionalNumberFromInput(),
});

type BotFormData = z.infer<typeof botSchema>;

const BotFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([]);
  const [planLinks, setPlanLinks] = useState<Array<{ linkId: string | number; planId: number }>>(
    []
  );
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BotFormData>({
    resolver: zodResolver(botSchema),
    defaultValues: {
      title: '',
      username: '',
      bot_token: '',
    },
  });

  const planOptions = useMemo(() => {
    const mapped = plans.map((plan) => ({
      id: Number(plan.id),
      label: plan.name,
      duration: plan.duration_days,
      isActive: plan.is_active,
    }));
    mapped.sort((a, b) => a.label.localeCompare(b.label));
    return mapped;
  }, [plans]);

  const plansMap = useMemo(() => {
    const map = new Map<number, SubscriptionPlan>();
    plans.forEach((plan) => map.set(Number(plan.id), plan));
    return map;
  }, [plans]);

  useEffect(() => {
    const loadPlans = async () => {
      setIsPlansLoading(true);
      try {
        const plansResponse = await plansApi.getAll();
        setPlans(plansResponse);
      } catch (error) {
        setPlans([]);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить тарифные планы',
          variant: 'destructive',
        });
      } finally {
        setIsPlansLoading(false);
      }
    };
    loadPlans();
  }, [toast]);

  useEffect(() => {
    if (id) {
      const fetchBot = async () => {
        try {
          const [botResult, plansResult] = await Promise.allSettled([
            botsApi.getById(id),
            botPlansApi.getByBotId(id),
          ]);

          if (botResult.status === 'fulfilled') {
            const bot = botResult.value;
            if (bot) {
              setValue('title', bot.title);
              setValue('username', bot.username);
              setValue('notification_group_id', bot.notification_group_id ?? undefined);
              setValue('bot_token', bot.bot_token);
              setValue('request_port', bot.request_port ?? undefined);

              const planIdsFromBot = extractPlanIds(
                (bot as Record<string, unknown>).plans ??
                  (bot as Record<string, unknown>).plan_ids ??
                  (bot as Record<string, unknown>).planIds
              );
              if (planIdsFromBot.length > 0) {
                setSelectedPlanIds(planIdsFromBot);
              }
            }
          } else {
            throw botResult.reason;
          }

          if (plansResult.status === 'fulfilled') {
            const links = extractPlanLinks(plansResult.value);
            if (links.length > 0) {
              setPlanLinks(links);
              const linkedPlanIds = links.map((link) => link.planId);
              if (linkedPlanIds.length > 0) {
                setSelectedPlanIds((prev) => {
                  const merged = new Set([...prev, ...linkedPlanIds]);
                  return Array.from(merged);
                });
              }
            } else {
              setPlanLinks([]);
            }
          } else if (plansResult.status === 'rejected') {
            toast({
              title: 'Ошибка',
              description: 'Не удалось загрузить тарифные планы бота',
              variant: 'destructive',
            });
          }
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось загрузить данные бота',
            variant: 'destructive',
          });
          navigate('/admin/bots');
        } finally {
          setIsFetching(false);
        }
      };
      fetchBot();
    }
  }, [id, setValue, toast, navigate]);

  useEffect(() => {
    if (!id) {
      setSelectedPlanIds([]);
      setPlanLinks([]);
    }
  }, [id]);

  const onSubmit = async (data: BotFormData) => {
    setIsLoading(true);
    try {
      const payload: Pick<Bot, 'title' | 'username'> & Partial<Bot> = {
        title: data.title,
        username: data.username,
      };
      if (typeof data.bot_token === 'string' && data.bot_token.trim() !== '') {
        payload.bot_token = data.bot_token;
      }
      if (typeof data.notification_group_id === 'number') {
        payload.notification_group_id = data.notification_group_id;
      }
      if (typeof data.request_port === 'number') {
        payload.request_port = data.request_port;
      }
      const uniquePlanIds = Array.from(new Set(selectedPlanIds)).filter(
        (planId) => Number.isFinite(planId) && planId > 0
      );
      const selectedPlanSet = new Set(uniquePlanIds);
      const existingPlanSet = new Set(planLinks.map((link) => link.planId));
      const linksToDelete = planLinks
        .filter((link) => !selectedPlanSet.has(link.planId))
        .map((link) => link.linkId);
      const planIdsToAdd = uniquePlanIds.filter((planId) => !existingPlanSet.has(planId));

      if (isEdit) {
        const updated = await botsApi.update(id!, payload);
        try {
          if (linksToDelete.length > 0) {
            await Promise.all(linksToDelete.map((linkId) => botPlansApi.delete(linkId)));
          }
          if (planIdsToAdd.length > 0) {
            await botPlansApi.bulkCreate(updated.id, planIdsToAdd);
          }
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Бот обновлён, но не удалось синхронизировать тарифы',
            variant: 'destructive',
          });
          return;
        }
        logRecentAction({
          entityType: 'bot',
          entityId: String(updated.id),
          entityName: updated.title,
          action: 'edit',
        });
        toast({ title: 'Успешно', description: 'Бот обновлён' });
      } else {
        const created = await botsApi.create(payload as Omit<Bot, 'id' | 'created_at'>);
        if (uniquePlanIds.length > 0) {
          try {
            await botPlansApi.bulkCreate(created.id, uniquePlanIds);
          } catch (error) {
            toast({
              title: 'Ошибка',
              description: 'Бот создан, но не удалось привязать тарифы',
              variant: 'destructive',
            });
            return;
          }
        }
        logRecentAction({
          entityType: 'bot',
          entityId: String(created.id),
          entityName: created.title,
          action: 'create',
        });
        toast({ title: 'Успешно', description: 'Бот создан' });
      }
      navigate('/admin/bots');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: isEdit ? 'Не удалось обновить бота' : 'Не удалось создать бота',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanToggle = (planId: number, checked: boolean | 'indeterminate') => {
    setSelectedPlanIds((prev) => {
      const updated = new Set(prev);
      if (checked === true) {
        updated.add(planId);
      } else {
        updated.delete(planId);
      }
      return Array.from(updated);
    });
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bots')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Редактировать бота' : 'Добавить бота'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Измените данные бота' : 'Заполните данные нового бота'}
          </p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Данные бота</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                placeholder="Основной бот"
                {...register('title')}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="@my_bot"
                {...register('username')}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_group_id">ID группы уведомлений</Label>
              <Input
                id="notification_group_id"
                type="number"
                placeholder="-213123123"
                {...register('notification_group_id')}
                disabled={isLoading}
              />
              {errors.notification_group_id && (
                <p className="text-sm text-destructive">
                  {errors.notification_group_id.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot_token">Токен бота</Label>
              <Input
                id="bot_token"
                placeholder="12345:ABC..."
                {...register('bot_token')}
                disabled={isLoading}
              />
              {errors.bot_token && (
                <p className="text-sm text-destructive">{errors.bot_token.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="request_port">Порт</Label>
              <Input
                id="request_port"
                type="number"
                {...register('request_port')}
                disabled={isLoading}
              />
              {errors.request_port && (
                <p className="text-sm text-destructive">
                  {errors.request_port.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Тарифные планы</Label>
                {selectedPlanIds.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Выбрано: {selectedPlanIds.length}
                  </span>
                )}
              </div>
              <div className="rounded-md border bg-muted/20 p-3 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Выберите один или несколько тарифов, которые будут доступны в боте.
                </p>
                <div className="space-y-2 max-h-52 overflow-auto pr-2">
                  {isPlansLoading && (
                    <div className="text-sm text-muted-foreground">Загрузка тарифов...</div>
                  )}
                  {!isPlansLoading && planOptions.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      Тарифные планы не найдены
                    </div>
                  )}
                  {!isPlansLoading &&
                    planOptions.map((plan) => {
                      const checkboxId = `plan-${plan.id}`;
                      const isChecked = selectedPlanIds.includes(plan.id);
                      return (
                        <div
                          key={plan.id}
                          className="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-muted/40"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={isChecked}
                            onCheckedChange={(checked) => handlePlanToggle(plan.id, checked)}
                            disabled={isLoading}
                          />
                          <label htmlFor={checkboxId} className="flex-1 cursor-pointer">
                            <div className="text-sm font-medium">{plan.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {plan.duration} дн.
                              {!plan.isActive && ' · Неактивен'}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                </div>
                {selectedPlanIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPlanIds.map((planId) => {
                      const plan = plansMap.get(planId);
                      const label = plan?.name ?? `План #${planId}`;
                      return (
                        <Badge key={planId} variant="secondary">
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/bots')}
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

export default BotFormPage;
