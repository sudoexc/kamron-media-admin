import React, { useState, useEffect } from 'react';
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
import { plansApi } from '@/api/entities';
import { useToast } from '@/hooks/use-toast';

const planSchema = z.object({
  title: z.string().min(1, 'Введите название').max(100),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  periodDays: z.number().min(1, 'Минимум 1 день'),
  isActive: z.boolean(),
});

type PlanFormData = z.infer<typeof planSchema>;

const PlanFormPage: React.FC = () => {
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
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: '',
      price: 0,
      periodDays: 30,
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (id) {
      const fetchPlan = async () => {
        try {
          const plan = await plansApi.getById(id);
          if (plan) {
            setValue('title', plan.title);
            setValue('price', plan.price);
            setValue('periodDays', plan.periodDays);
            setValue('isActive', plan.isActive);
          }
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось загрузить данные тарифа',
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
      if (isEdit) {
        await plansApi.update(id!, data);
        toast({ title: 'Успешно', description: 'Тариф обновлён' });
      } else {
        await plansApi.create(data as { title: string; price: number; periodDays: number; isActive: boolean });
        toast({ title: 'Успешно', description: 'Тариф создан' });
      }
      navigate('/admin/subscription-plans');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: isEdit ? 'Не удалось обновить тариф' : 'Не удалось создать тариф',
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
            {isEdit ? 'Редактировать тариф' : 'Добавить тариф'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Измените данные тарифа' : 'Заполните данные нового тарифа'}
          </p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Данные тарифа</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                placeholder="Премиум"
                {...register('title')}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена (₽)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="999"
                  {...register('price', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodDays">Период (дней)</Label>
                <Input
                  id="periodDays"
                  type="number"
                  placeholder="30"
                  {...register('periodDays', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.periodDays && (
                  <p className="text-sm text-destructive">{errors.periodDays.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="isActive">Активен</Label>
                <p className="text-sm text-muted-foreground">
                  Тариф будет доступен для покупки
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
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
