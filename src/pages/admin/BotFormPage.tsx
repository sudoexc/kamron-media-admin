import React, { useState, useEffect } from 'react';
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
import { botsApi } from '@/api/entities';
import { Bot } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';

const botSchema = z.object({
  name: z.string().min(1, 'Введите название').max(100),
  username: z.string().min(1, 'Введите username').max(50),
  status: z.enum(['active', 'inactive', 'suspended']),
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
    watch,
    formState: { errors },
  } = useForm<BotFormData>({
    resolver: zodResolver(botSchema),
    defaultValues: {
      name: '',
      username: '',
      status: 'active',
    },
  });

  const status = watch('status');

  useEffect(() => {
    if (id) {
      const fetchBot = async () => {
        try {
          const bot = await botsApi.getById(id);
          if (bot) {
            setValue('name', bot.name);
            setValue('username', bot.username);
            setValue('status', bot.status);
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
        await botsApi.update(id!, data);
        toast({ title: 'Успешно', description: 'Бот обновлён' });
      } else {
        await botsApi.create(data as Omit<Bot, 'id' | 'createdAt'>);
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
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                placeholder="Основной бот"
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
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
              <Label>Статус</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as 'active' | 'inactive' | 'suspended')
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
                  <SelectItem value="suspended">Приостановлен</SelectItem>
                </SelectContent>
              </Select>
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
