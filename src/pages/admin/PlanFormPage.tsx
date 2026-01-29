import React, { useState, useEffect, useMemo } from 'react';
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
import { plansApi, botsApi } from '@/api/entities';
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

const planSchema = z.object({
  bot: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: 'Выберите бота' }).int('Только целое число')
  ),
  name: z.string().min(1, 'Введите название').max(100),
  duration_days: numberFromInput('Введите длительность'),
  price_usdt: z.string().min(1, 'Введите цену в USDT'),
  price_uzs: z.string().min(1, 'Введите цену в UZS'),
  price_stars: z.string().min(1, 'Введите цену в STARS'),
  price_rub: z.string().min(1, 'Введите цену в RUB'),
  is_active: z.boolean(),
});

type PlanFormData = z.infer<typeof planSchema>;

const PlanFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [bots, setBots] = useState<Bot[]>([]);
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      bot: 0,
      name: '',
      price_usdt: '',
      price_uzs: '',
      price_stars: '',
      price_rub: '',
      is_active: true,
    },
  });

  const isActive = watch('is_active');
  const selectedBot = watch('bot');

  const botOptions = useMemo(
    () =>
      bots.map((bot) => ({
        id: Number(bot.id),
        label: `${bot.title} (${bot.username})`,
      })),
    [bots]
  );

  useEffect(() => {
    const loadBots = async () => {
      try {
        const botsResponse = await botsApi.getAll();
        setBots(botsResponse);
      } catch {
        setBots([]);
      }
    };
    loadBots();

    if (id) {
      const fetchPlan = async () => {
        try {
          const plan = await plansApi.getById(id);
          if (plan) {
            setValue('bot', plan.bot);
            setValue('name', plan.name);
            setValue('duration_days', plan.duration_days);
            setValue('price_usdt', plan.price_usdt);
            setValue('price_uzs', plan.price_uzs);
            setValue('price_stars', plan.price_stars);
            setValue('price_rub', plan.price_rub);
            setValue('is_active', plan.is_active);
          }
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось загрузить данные плана',
            variant: 'destructive',
          });
          navigate('/admin/subscription-plans');
        } finally {
          setIsFetching(false);
        }
      };
      fetchPlan();
    }
  }, [id, setValue, toast, navigate]);

  const onSubmit = async (data: PlanFormData) => {
    setIsLoading(true);
    try {
      const payload: Omit<SubscriptionPlan, 'id' | 'created_at'> = {
        bot: data.bot,
        name: data.name,
        duration_days: data.duration_days,
        price_usdt: data.price_usdt,
        price_uzs: data.price_uzs,
        price_stars: data.price_stars,
        price_rub: data.price_rub,
        is_active: data.is_active,
      };
      if (isEdit) {
        const updated = await plansApi.update(id!, payload);
        logRecentAction({
          entityType: 'plan',
          entityId: String(updated.id),
          entityName: updated.name,
          action: 'edit',
        });
        toast({ title: 'Успешно', description: 'План обновлён' });
      } else {
        const created = await plansApi.create(payload);
        logRecentAction({
          entityType: 'plan',
          entityId: String(created.id),
          entityName: created.name,
          action: 'create',
        });
        toast({ title: 'Успешно', description: 'План создан' });
      }
      navigate('/admin/subscription-plans');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: isEdit ? 'Не удалось обновить план' : 'Не удалось создать план',
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/subscription-plans')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Редактировать План подписки' : 'Добавить План подписки'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Измените данные плана' : 'Заполните данные нового плана'}
          </p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Данные плана</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_days">Duration days</Label>
              <Input
                id="duration_days"
                type="number"
                {...register('duration_days')}
                disabled={isLoading}
              />
              {errors.duration_days && (
                <p className="text-sm text-destructive">
                  {errors.duration_days.message as string}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_usdt">Price usdt</Label>
                <Input
                  id="price_usdt"
                  type="number"
                  step="0.01"
                  {...register('price_usdt')}
                  disabled={isLoading}
                />
                {errors.price_usdt && (
                  <p className="text-sm text-destructive">{errors.price_usdt.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_uzs">Price uzs</Label>
                <Input
                  id="price_uzs"
                  type="number"
                  step="0.01"
                  {...register('price_uzs')}
                  disabled={isLoading}
                />
                {errors.price_uzs && (
                  <p className="text-sm text-destructive">{errors.price_uzs.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_stars">Price stars</Label>
                <Input
                  id="price_stars"
                  type="number"
                  step="0.01"
                  {...register('price_stars')}
                  disabled={isLoading}
                />
                {errors.price_stars && (
                  <p className="text-sm text-destructive">{errors.price_stars.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_rub">Price rub</Label>
                <Input
                  id="price_rub"
                  type="number"
                  step="0.01"
                  {...register('price_rub')}
                  disabled={isLoading}
                />
                {errors.price_rub && (
                  <p className="text-sm text-destructive">{errors.price_rub.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="is_active">Is active</Label>
                <p className="text-sm text-muted-foreground">
                  План будет доступен для покупки
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
                onClick={() => navigate('/admin/subscription-plans')}
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

export default PlanFormPage;
