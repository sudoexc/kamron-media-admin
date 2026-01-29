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
import { Loader2, ArrowLeft } from 'lucide-react';
import { paymentMethodsApi } from '@/api/entities';
import { PaymentMethod } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import { logRecentAction } from '@/lib/recent-actions';

const methodSchema = z.object({
  name: z.string().min(1, 'Введите название').max(100),
  callback_data: z.string().min(1, 'Введите callback_data').max(200),
  is_active: z.boolean(),
});

type MethodFormData = z.infer<typeof methodSchema>;

const PaymentMethodFormPage: React.FC = () => {
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
  } = useForm<MethodFormData>({
    resolver: zodResolver(methodSchema),
    defaultValues: {
      name: '',
      callback_data: '',
      is_active: true,
    },
  });

  const isActive = watch('is_active');

  useEffect(() => {
    if (!id) {
      setIsFetching(false);
      return;
    }

    const fetchMethod = async () => {
      try {
        const method = await paymentMethodsApi.getById(id);
        if (method) {
          const label = method.name || method.title || '';
          setValue('name', label);
          setValue('callback_data', method.callback_data || '');
          setValue('is_active', method.is_active ?? method.isActive ?? true);
        }
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить способ оплаты',
          variant: 'destructive',
        });
        navigate('/admin/payment-methods');
      } finally {
        setIsFetching(false);
      }
    };

    fetchMethod();
  }, [id, navigate, setValue, toast]);

  const onSubmit = async (data: MethodFormData) => {
    setIsLoading(true);
    try {
      const name = data.name.trim();
      const callbackData = data.callback_data.trim();
      const payload: Partial<PaymentMethod> = {
        name,
        callback_data: callbackData,
        is_active: data.is_active,
      };

      if (isEdit) {
        const updated = await paymentMethodsApi.update(id!, payload);
        logRecentAction({
          entityType: 'payment_method',
          entityId: String(updated.id ?? id),
          entityName: updated.name || updated.title || name,
          action: 'edit',
        });
        toast({ title: 'Успешно', description: 'Способ оплаты обновлён' });
      } else {
        const created = await paymentMethodsApi.create(payload);
        logRecentAction({
          entityType: 'payment_method',
          entityId: String(created.id),
          entityName: created.name || created.title || name,
          action: 'create',
        });
        toast({ title: 'Успешно', description: 'Способ оплаты создан' });
      }
      navigate('/admin/payment-methods');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: isEdit
          ? 'Не удалось обновить способ оплаты'
          : 'Не удалось создать способ оплаты',
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
          onClick={() => navigate('/admin/payment-methods')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Редактировать способ оплаты' : 'Добавить способ оплаты'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? 'Измените данные способа оплаты'
              : 'Заполните данные нового способа оплаты'}
          </p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Данные способа оплаты</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
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
              <Label htmlFor="callback_data">Callback data</Label>
              <Input
                id="callback_data"
                {...register('callback_data')}
                disabled={isLoading}
              />
              {errors.callback_data && (
                <p className="text-sm text-destructive">
                  {errors.callback_data.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="is_active">Активен</Label>
                <p className="text-sm text-muted-foreground">
                  Способ будет доступен для оплаты
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
                onClick={() => navigate('/admin/payment-methods')}
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

export default PaymentMethodFormPage;
