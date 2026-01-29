import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { botsApi } from '@/api/entities';
import { Bot } from '@/types/entities';
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

const botSchema = z.object({
  title: z.string().min(1, 'Введите название').max(100),
  username: z.string().min(1, 'Введите username').max(50),
  notification_group_id: numberFromInput('Введите ID группы'),
  bot_token: z.string().min(1, 'Введите токен бота'),
  request_port: numberFromInput('Введите порт'),
});

type BotFormData = z.infer<typeof botSchema>;

const BotFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
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

  useEffect(() => {
    if (id) {
      const fetchBot = async () => {
        try {
          const bot = await botsApi.getById(id);
          if (bot) {
            setValue('title', bot.title);
            setValue('username', bot.username);
            setValue('notification_group_id', bot.notification_group_id);
            setValue('bot_token', bot.bot_token);
            setValue('request_port', bot.request_port ?? undefined);
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

  const onSubmit = async (data: BotFormData) => {
    setIsLoading(true);
    try {
      if (isEdit) {
        const updated = await botsApi.update(id!, data);
        logRecentAction({
          entityType: 'bot',
          entityId: String(updated.id),
          entityName: updated.title,
          action: 'edit',
        });
        toast({ title: 'Успешно', description: 'Бот обновлён' });
      } else {
        const created = await botsApi.create(data as Omit<Bot, 'id' | 'created_at'>);
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
                placeholder="5670"
                {...register('request_port')}
                disabled={isLoading}
              />
              {errors.request_port && (
                <p className="text-sm text-destructive">
                  {errors.request_port.message as string}
                </p>
              )}
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
