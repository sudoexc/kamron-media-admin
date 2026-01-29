import { 
  Bot, 
  SubscriptionPlan, 
  Payment, 
  Subscription, 
  User, 
  Message, 
  PaymentMethod, 
  Group,
  RecentAction,
  DashboardStats,
  AuthUser
} from '@/types/entities';

// Storage keys
const STORAGE_KEYS = {
  BOTS: 'admin_bots',
  PLANS: 'admin_plans',
  PAYMENTS: 'admin_payments',
  SUBSCRIPTIONS: 'admin_subscriptions',
  USERS: 'admin_users',
  MESSAGES: 'admin_messages',
  PAYMENT_METHODS: 'admin_payment_methods',
  GROUPS: 'admin_groups',
  RECENT_ACTIONS: 'admin_recent_actions',
};

// Initial mock data
const initialBots: Bot[] = [
  {
    id: '1',
    title: 'Основной бот',
    username: '@main_bot',
    notification_group_id: 1001,
    bot_token: 'token-1',
    request_port: 5600,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Поддержка',
    username: '@support_bot',
    notification_group_id: 1002,
    bot_token: 'token-2',
    request_port: 5601,
    created_at: '2024-01-20T14:30:00Z',
  },
  {
    id: '3',
    title: 'Тестовый',
    username: '@test_bot',
    notification_group_id: 1003,
    bot_token: 'token-3',
    request_port: 5602,
    created_at: '2024-02-01T09:00:00Z',
  },
  {
    id: '4',
    title: 'Промо бот',
    username: '@promo_bot',
    notification_group_id: 1004,
    bot_token: 'token-4',
    request_port: 5603,
    created_at: '2024-02-10T16:45:00Z',
  },
];

const initialPlans: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Базовый',
    duration_days: 30,
    price_usdt: '3.00',
    price_uzs: '35000.00',
    price_stars: '1.00',
    price_rub: '299.00',
    is_active: true,
    bot: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Стандарт',
    duration_days: 30,
    price_usdt: '6.00',
    price_uzs: '65000.00',
    price_stars: '1.00',
    price_rub: '599.00',
    is_active: true,
    bot: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Премиум',
    duration_days: 30,
    price_usdt: '9.00',
    price_uzs: '99000.00',
    price_stars: '1.00',
    price_rub: '999.00',
    is_active: true,
    bot: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Годовой',
    duration_days: 365,
    price_usdt: '90.00',
    price_uzs: '799000.00',
    price_stars: '1.00',
    price_rub: '7999.00',
    is_active: true,
    bot: 2,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '5',
    name: 'Пробный',
    duration_days: 7,
    price_usdt: '0.00',
    price_uzs: '0.00',
    price_stars: '0.00',
    price_rub: '0.00',
    is_active: false,
    bot: 3,
    created_at: '2024-02-01T00:00:00Z',
  },
];

const initialUsers: User[] = [
  { telegram_id: 5649451092, language: 'ru', is_active: true, created_at: '2024-02-10T09:45:00Z' },
  { telegram_id: 5317913776, language: 'uz', is_active: false, created_at: '2024-02-08T12:10:00Z' },
  { telegram_id: 5123456789, language: 'ru', is_active: true, created_at: '2024-01-15T12:00:00Z' },
];

const initialPayments: Payment[] = [
  {
    id: '1',
    user: 5649451092,
    bot: 1,
    subscription: 1,
    amount: '599.00',
    method: 'card',
    status: 'success',
    created_at: '2024-02-15T10:30:00Z',
  },
  {
    id: '2',
    user: 5317913776,
    bot: 2,
    subscription: 2,
    amount: '999.00',
    method: 'card',
    status: 'success',
    created_at: '2024-02-15T11:45:00Z',
  },
  {
    id: '3',
    user: 5123456789,
    bot: 3,
    subscription: 3,
    amount: '299.00',
    method: 'sbp',
    status: 'pending',
    created_at: '2024-02-15T14:00:00Z',
  },
  {
    id: '4',
    user: 5649451092,
    bot: 1,
    subscription: 4,
    amount: '7999.00',
    method: 'card',
    status: 'success',
    created_at: '2024-02-14T16:20:00Z',
  },
  {
    id: '5',
    user: 5649451092,
    bot: 4,
    subscription: 1,
    amount: '599.00',
    method: 'yoomoney',
    status: 'failed',
    created_at: '2024-02-14T09:15:00Z',
  },
];

const initialSubscriptions: Subscription[] = [
  {
    id: '1',
    user: 5649451092,
    bot: 1,
    plan: 2,
    start_date: '2024-02-15T10:30:00Z',
    end_date: '2024-03-15T10:30:00Z',
    is_active: true,
    created_at: '2024-02-15T10:30:00Z',
  },
  {
    id: '2',
    user: 5317913776,
    bot: 2,
    plan: 3,
    start_date: '2024-02-15T11:45:00Z',
    end_date: '2024-03-15T11:45:00Z',
    is_active: true,
    created_at: '2024-02-15T11:45:00Z',
  },
  {
    id: '3',
    user: 5123456789,
    bot: 3,
    plan: 1,
    start_date: '2024-01-20T09:00:00Z',
    end_date: '2024-02-20T09:00:00Z',
    is_active: false,
    created_at: '2024-01-20T09:00:00Z',
  },
  {
    id: '4',
    user: 5649451092,
    bot: 1,
    plan: 4,
    start_date: '2024-02-14T16:20:00Z',
    end_date: '2025-02-14T16:20:00Z',
    is_active: true,
    created_at: '2024-02-14T16:20:00Z',
  },
];

const initialMessages: Message[] = [
  {
    id: 1,
    identifier: 'subscription_purchased',
    message_ru: '✅ Спасибо за покупку! Ваша подписка активирована до {end_date}',
    message_en: '✅ Thank you for your purchase! Your subscription is active until {end_date}',
    message_uz: '✅ Xarid uchun rahmat! Obunangiz {end_date} gacha faol',
  },
  {
    id: 2,
    identifier: 'subscription_expiring',
    message_ru: '⚠️ Ваша подписка истекает {end_date}. Продлите сейчас!',
    message_en: '⚠️ Your subscription expires on {end_date}. Renew now!',
    message_uz: '⚠️ Obunangiz {end_date} tugaydi. Hozir yangilang!',
  },
  {
    id: 3,
    identifier: 'subscription_expired',
    message_ru: '❌ Ваша подписка истекла {end_date}. Продлите для продолжения использования.',
    message_en: '❌ Your subscription expired on {end_date}. Renew to continue using.',
    message_uz: '❌ Obunangiz {end_date} tugadi. Davom ettirish uchun yangilang.',
  },
];

const initialPaymentMethods: PaymentMethod[] = [
  { id: '1', title: 'Банковская карта', provider: 'stripe', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', title: 'СБП', provider: 'sbp', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: '3', title: 'ЮMoney', provider: 'yoomoney', isActive: true, createdAt: '2024-01-15T00:00:00Z' },
  { id: '4', title: 'Криптовалюта', provider: 'crypto', isActive: false, createdAt: '2024-02-01T00:00:00Z' },
];

const initialGroups: Group[] = [
  { id: '1', name: 'Администраторы', permissionsCount: 25, createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Модераторы', permissionsCount: 15, createdAt: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Пользователи', permissionsCount: 5, createdAt: '2024-01-01T00:00:00Z' },
];

const initialRecentActions: RecentAction[] = [
  { id: '1', entityType: 'user', entityId: '6', entityName: 'Анна Морозова', action: 'create', userId: '1', userName: 'Админ', timestamp: '2024-02-15T14:30:00Z' },
  { id: '2', entityType: 'payment', entityId: '4', entityName: 'Оплата #4', action: 'create', userId: '1', userName: 'Админ', timestamp: '2024-02-15T14:00:00Z' },
  { id: '3', entityType: 'subscription', entityId: '4', entityName: 'Подписка Анна Морозова', action: 'create', userId: '1', userName: 'Админ', timestamp: '2024-02-15T13:45:00Z' },
  { id: '4', entityType: 'bot', entityId: '4', entityName: 'Промо бот', action: 'edit', userId: '1', userName: 'Админ', timestamp: '2024-02-15T12:00:00Z' },
  { id: '5', entityType: 'plan', entityId: '5', entityName: 'Пробный', action: 'create', userId: '1', userName: 'Админ', timestamp: '2024-02-15T10:30:00Z' },
];

// Helper to get or initialize data
function getStorageData<T>(key: string, initialData: T[]): T[] {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialData;
    }
  }
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
}

function setStorageData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Getters
export const getMockBots = (): Bot[] => getStorageData(STORAGE_KEYS.BOTS, initialBots);
export const getMockPlans = (): SubscriptionPlan[] => getStorageData(STORAGE_KEYS.PLANS, initialPlans);
export const getMockPayments = (): Payment[] => getStorageData(STORAGE_KEYS.PAYMENTS, initialPayments);
export const getMockSubscriptions = (): Subscription[] => getStorageData(STORAGE_KEYS.SUBSCRIPTIONS, initialSubscriptions);
export const getMockUsers = (): User[] => getStorageData(STORAGE_KEYS.USERS, initialUsers);
export const getMockMessages = (): Message[] => getStorageData(STORAGE_KEYS.MESSAGES, initialMessages);
export const getMockPaymentMethods = (): PaymentMethod[] => getStorageData(STORAGE_KEYS.PAYMENT_METHODS, initialPaymentMethods);
export const getMockGroups = (): Group[] => getStorageData(STORAGE_KEYS.GROUPS, initialGroups);
export const getMockRecentActions = (): RecentAction[] => getStorageData(STORAGE_KEYS.RECENT_ACTIONS, initialRecentActions);

// Setters
export const setMockBots = (data: Bot[]): void => setStorageData(STORAGE_KEYS.BOTS, data);
export const setMockPlans = (data: SubscriptionPlan[]): void => setStorageData(STORAGE_KEYS.PLANS, data);
export const setMockPayments = (data: Payment[]): void => setStorageData(STORAGE_KEYS.PAYMENTS, data);
export const setMockSubscriptions = (data: Subscription[]): void => setStorageData(STORAGE_KEYS.SUBSCRIPTIONS, data);
export const setMockUsers = (data: User[]): void => setStorageData(STORAGE_KEYS.USERS, data);
export const setMockMessages = (data: Message[]): void => setStorageData(STORAGE_KEYS.MESSAGES, data);
export const setMockPaymentMethods = (data: PaymentMethod[]): void => setStorageData(STORAGE_KEYS.PAYMENT_METHODS, data);
export const setMockGroups = (data: Group[]): void => setStorageData(STORAGE_KEYS.GROUPS, data);
export const setMockRecentActions = (data: RecentAction[]): void => setStorageData(STORAGE_KEYS.RECENT_ACTIONS, data);

// Add recent action helper
export const addRecentAction = (action: Omit<RecentAction, 'id' | 'timestamp'>): void => {
  const actions = getMockRecentActions();
  const newAction: RecentAction = {
    ...action,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  setMockRecentActions([newAction, ...actions].slice(0, 50));
};

// Dashboard stats
export const getMockDashboardStats = (): DashboardStats => {
  const users = getMockUsers();
  const subscriptions = getMockSubscriptions();
  const payments = getMockPayments();
  
  const activeSubscriptions = subscriptions.filter(s => s.is_active).length;
  const isPaidStatus = (status: string) =>
    ['success', 'completed'].includes(status.toLowerCase());

  const todayPayments = payments.filter(p => {
    const paymentDate = new Date(p.created_at ?? '').toDateString();
    return paymentDate === new Date().toDateString() && isPaidStatus(p.status);
  }).length;
  const totalRevenue = payments
    .filter(p => isPaidStatus(p.status))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return {
    totalUsers: users.length,
    activeSubscriptions,
    todayPayments,
    totalRevenue,
    userGrowth: 12.5,
    subscriptionGrowth: 8.3,
    paymentGrowth: -2.1,
    revenueGrowth: 15.7,
  };
};

// Mock auth user
export const mockAuthUser: AuthUser = {
  id: '1',
  name: 'Админ',
  email: 'admin@example.com',
  role: 'admin',
  avatar: undefined,
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
