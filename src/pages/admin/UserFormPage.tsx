import React, { useEffect, useState } from 'react';
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
import { usersApi } from '@/api/entities';
import { User } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';

const userSchema = z.object({
  telegram_id: z.preprocess(
    (val) => Number(val),
    z
      .number({ required_error: 'Введите Telegram ID' })
      .int('Только целое число')
      .min(1, 'Введите Telegram ID')
  ),
  language: z.enum(['ru', 'en', 'uz']),
  is_active: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

const UserFormPage: React.FC = () => {
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
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      telegram_id: undefined,
      language: 'ru',
      is_active: true,
    },
  });

  const isActive = watch('is_active');
  const language = watch('language');

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const user = await usersApi.getById(id);
          if (user) {
            setValue('telegram_id', user.telegram_id);
            setValue('language', user.language);
            setValue('is_active', user.is_active);
          }
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось загрузить пользователя',
            variant: 'destructive',
          });
          navigate('/admin/users');
        } finally {
          setIsFetching(false);
        }
      };
      fetchUser();
    } else {
      setIsFetching(false);
    }
  }, [id, navigate, setValue, toast]);

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const payload: User = {
        telegram_id: data.telegram_id,
        language: data.language,
        is_active: data.is_active,
      };
      if (isEdit) {
        await usersApi.update(id!, payload);
        toast({ title: 'Успешно', description: 'Пользователь обновлён' });
      } else {
        await usersApi.create(payload);
        toast({ title: 'Успешно', description: 'Пользователь создан' });
      }
      navigate('/admin/users');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: isEdit
          ? 'Не удалось обновить пользователя'
          : 'Не удалось создать пользователя',
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Редактировать пользователя' : 'Добавить пользователя'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Измените данные пользователя' : 'Заполните данные нового пользователя'}
          </p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Данные пользователя</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram_id">Telegram ID</Label>
              <Input
                id="telegram_id"
                type="number"
                {...register('telegram_id')}
                disabled={isLoading || isEdit}
              />
              {errors.telegram_id && (
                <p className="text-sm text-destructive">
                  {errors.telegram_id.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={language}
                onValueChange={(value) => setValue('language', value as 'ru' | 'en' | 'uz')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="uz">O‘zbek</SelectItem>
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-sm text-destructive">{errors.language.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="is_active">Is active</Label>
                <p className="text-sm text-muted-foreground">
                  Пользователь будет активен
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
                onClick={() => navigate('/admin/users')}
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

export default UserFormPage;
