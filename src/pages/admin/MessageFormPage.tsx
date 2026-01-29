import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { messagesApi } from '@/api/entities';
import { apiClient } from '@/api/client';
import { Message } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const messageSchema = z.object({
  identifier: z.string().min(1, 'Введите identifier'),
  message_ru: z.string().min(1, 'Введите сообщение на русском'),
  message_en: z.string().min(1, 'Введите сообщение на английском'),
  message_uz: z.string().min(1, 'Введите сообщение на узбекском'),
});

type MessageFormData = z.infer<typeof messageSchema>;

const MessageFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testUserId, setTestUserId] = useState('');
  const [testLanguage, setTestLanguage] = useState<'RU' | 'EN' | 'UZ'>('RU');
  const [testMessage, setTestMessage] = useState('');
  const [isTestSending, setIsTestSending] = useState(false);
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      identifier: '',
      message_ru: '',
      message_en: '',
      message_uz: '',
    },
  });

  const messageRu = watch('message_ru');
  const messageEn = watch('message_en');
  const messageUz = watch('message_uz');

  useEffect(() => {
    if (!id) {
      setIsFetching(false);
      return;
    }

    const fetchMessage = async () => {
      try {
        const message = await messagesApi.getById(id);
        setValue('identifier', message.identifier);
        setValue('message_ru', message.message_ru);
        setValue('message_en', message.message_en);
        setValue('message_uz', message.message_uz);
      } catch {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить сообщение',
          variant: 'destructive',
        });
        navigate('/admin/messages');
      } finally {
        setIsFetching(false);
      }
    };

    fetchMessage();
  }, [id, navigate, setValue, toast]);

  const onSubmit = async (data: MessageFormData) => {
    setIsLoading(true);
    try {
      const payload: Omit<Message, 'id'> = {
        identifier: data.identifier,
        message_ru: data.message_ru,
        message_en: data.message_en,
        message_uz: data.message_uz,
      };

      if (isEdit) {
        await messagesApi.update(id!, payload);
        toast({ title: 'Успешно', description: 'Сообщение обновлено' });
      } else {
        await messagesApi.create(payload);
        toast({ title: 'Успешно', description: 'Сообщение создано' });
      }
      navigate('/admin/messages');
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
            ? 'Не удалось обновить сообщение'
            : 'Не удалось создать сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async (text: string, langLabel: string) => {
    const userId = Number(testUserId);
    if (!testUserId || Number.isNaN(userId) || userId <= 0) {
      toast({
        title: 'Введите user_id',
        description: 'Нужен Telegram ID для отправки теста',
        variant: 'destructive',
      });
      return;
    }
    if (!text.trim()) {
      toast({
        title: 'Пустой текст',
        description: 'Введите текст сообщения для проверки',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsTestSending(true);
      await apiClient.post('/send_test_message/', {
        user_id: userId,
        message_text: text,
      });
      toast({
        title: 'Отправлено',
        description: `Тестовое сообщение (${langLabel}) отправлено`,
      });
      setTestDialogOpen(false);
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
        description: details || 'Не удалось отправить тестовое сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsTestSending(false);
    }
  };

  const openTestDialog = (lang: 'RU' | 'EN' | 'UZ', text: string) => {
    setTestLanguage(lang);
    setTestMessage(text);
    setTestDialogOpen(true);
  };

  const getLangLabel = (lang: 'RU' | 'EN' | 'UZ') => {
    if (lang === 'RU') return 'Русский 🇷🇺';
    if (lang === 'EN') return 'English 🇬🇧';
    return 'O‘zbek 🇺🇿';
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/messages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? `Messages object (${id})` : 'Добавить сообщение'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Измените шаблон сообщения' : 'Создайте шаблон сообщения'}
          </p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Данные сообщения</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Identifier:</Label>
              <Input
                id="identifier"
                placeholder="subscription_purchased"
                {...register('identifier')}
                disabled={isLoading}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">
                  {errors.identifier.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_ru">Message ru:</Label>
              <Textarea
                id="message_ru"
                rows={4}
                {...register('message_ru')}
                disabled={isLoading}
              />
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
                onClick={() => openTestDialog('RU', messageRu || '')}
              >
                Проверить текст (RU)
              </Button>
              {errors.message_ru && (
                <p className="text-sm text-destructive">
                  {errors.message_ru.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_en">Message en:</Label>
              <Textarea
                id="message_en"
                rows={4}
                {...register('message_en')}
                disabled={isLoading}
              />
              <Button
                type="button"
                className="bg-sky-600 hover:bg-sky-700 text-white"
                disabled={isLoading}
                onClick={() => openTestDialog('EN', messageEn || '')}
              >
                Проверить текст (EN)
              </Button>
              {errors.message_en && (
                <p className="text-sm text-destructive">
                  {errors.message_en.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_uz">Message uz:</Label>
              <Textarea
                id="message_uz"
                rows={4}
                {...register('message_uz')}
                disabled={isLoading}
              />
              <Button
                type="button"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950"
                disabled={isLoading}
                onClick={() => openTestDialog('UZ', messageUz || '')}
              >
                Проверить текст (UZ)
              </Button>
              {errors.message_uz && (
                <p className="text-sm text-destructive">
                  {errors.message_uz.message as string}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/messages')}
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

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-xl bg-muted/95 border-border/70">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-5 w-5 text-primary" />
              Тестовая отправка сообщения
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Язык: <span className="text-foreground font-medium">{getLangLabel(testLanguage)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="test_user_id">Введите Telegram User ID:</Label>
              <Input
                id="test_user_id"
                type="number"
                value={testUserId}
                onChange={(event) => setTestUserId(event.target.value)}
                placeholder="Например: 123456789"
                disabled={isLoading || isTestSending}
              />
            </div>
          </div>
          <DialogFooter className="pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
              disabled={isTestSending}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={() => sendTestMessage(testMessage, testLanguage)}
              disabled={isTestSending}
            >
              {isTestSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageFormPage;
