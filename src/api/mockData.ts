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
  { id: '1', name: 'Основной бот', username: '@main_bot', status: 'active', createdAt: '2024-01-15T10:00:00Z' },
  { id: '2', name: 'Поддержка', username: '@support_bot', status: 'active', createdAt: '2024-01-20T14:30:00Z' },
  { id: '3', name: 'Тестовый', username: '@test_bot', status: 'inactive', createdAt: '2024-02-01T09:00:00Z' },
  { id: '4', name: 'Промо бот', username: '@promo_bot', status: 'suspended', createdAt: '2024-02-10T16:45:00Z' },
];

const initialPlans: SubscriptionPlan[] = [
  { id: '1', title: 'Базовый', price: 299, periodDays: 30, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', title: 'Стандарт', price: 599, periodDays: 30, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: '3', title: 'Премиум', price: 999, periodDays: 30, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: '4', title: 'Годовой', price: 7999, periodDays: 365, isActive: true, createdAt: '2024-01-15T00:00:00Z' },
  { id: '5', title: 'Пробный', price: 0, periodDays: 7, isActive: false, createdAt: '2024-02-01T00:00:00Z' },
];

const initialUsers: User[] = [
  { id: '1', phone: '+7 (999) 123-45-67', name: 'Иван Петров', email: 'ivan@example.com', role: 'admin', createdAt: '2024-01-10T08:00:00Z' },
  { id: '2', phone: '+7 (999) 234-56-78', name: 'Мария Сидорова', email: 'maria@example.com', role: 'user', createdAt: '2024-01-15T12:00:00Z' },
  { id: '3', phone: '+7 (999) 345-67-89', name: 'Алексей Козлов', email: 'alex@example.com', role: 'user', createdAt: '2024-01-20T15:30:00Z' },
  { id: '4', phone: '+7 (999) 456-78-90', name: 'Елена Новикова', email: 'elena@example.com', role: 'moderator', createdAt: '2024-02-01T10:00:00Z' },
  { id: '5', phone: '+7 (999) 567-89-01', name: 'Дмитрий Волков', email: 'dmitry@example.com', role: 'user', createdAt: '2024-02-05T14:20:00Z' },
  { id: '6', phone: '+7 (999) 678-90-12', name: 'Анна Морозова', email: 'anna@example.com', role: 'user', createdAt: '2024-02-10T09:45:00Z' },
];

const initialPayments: Payment[] = [
  { id: '1', userId: '2', userName: 'Мария Сидорова', amount: 599, method: 'card', status: 'completed', createdAt: '2024-02-15T10:30:00Z' },
  { id: '2', userId: '3', userName: 'Алексей Козлов', amount: 999, method: 'card', status: 'completed', createdAt: '2024-02-15T11:45:00Z' },
  { id: '3', userId: '5', userName: 'Дмитрий Волков', amount: 299, method: 'sbp', status: 'pending', createdAt: '2024-02-15T14:00:00Z' },
  { id: '4', userId: '6', userName: 'Анна Морозова', amount: 7999, method: 'card', status: 'completed', createdAt: '2024-02-14T16:20:00Z' },
  { id: '5', userId: '2', userName: 'Мария Сидорова', amount: 599, method: 'yoomoney', status: 'failed', createdAt: '2024-02-14T09:15:00Z' },
];

const initialSubscriptions: Subscription[] = [
  { id: '1', userId: '2', userName: 'Мария Сидорова', planId: '2', planTitle: 'Стандарт', startAt: '2024-02-15T00:00:00Z', endAt: '2024-03-15T00:00:00Z', status: 'active' },
  { id: '2', userId: '3', userName: 'Алексей Козлов', planId: '3', planTitle: 'Премиум', startAt: '2024-02-15T00:00:00Z', endAt: '2024-03-15T00:00:00Z', status: 'active' },
  { id: '3', userId: '5', userName: 'Дмитрий Волков', planId: '1', planTitle: 'Базовый', startAt: '2024-01-20T00:00:00Z', endAt: '2024-02-20T00:00:00Z', status: 'expired' },
  { id: '4', userId: '6', userName: 'Анна Морозова', planId: '4', planTitle: 'Годовой', startAt: '2024-02-14T00:00:00Z', endAt: '2025-02-14T00:00:00Z', status: 'active' },
];

const initialMessages: Message[] = [
  { id: '1', userId: '2', userName: 'Мария Сидорова', text: 'Здравствуйте! Как продлить подписку?', status: 'read', createdAt: '2024-02-15T10:00:00Z' },
  { id: '2', userId: '3', userName: 'Алексей Козлов', text: 'Не работает оплата', status: 'delivered', createdAt: '2024-02-15T11:30:00Z' },
  { id: '3', userId: '5', userName: 'Дмитрий Волков', text: 'Спасибо за быстрый ответ!', status: 'sent', createdAt: '2024-02-15T14:15:00Z' },
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
  { id: '1', entityType: 'user', entityId: '6', entityName: 'Анна Морозова', action: 'create', userId: '1', userName: 'Иван Петров', timestamp: '2024-02-15T14:30:00Z' },
  { id: '2', entityType: 'payment', entityId: '4', entityName: 'Оплата #4', action: 'create', userId: '1', userName: 'Иван Петров', timestamp: '2024-02-15T14:00:00Z' },
  { id: '3', entityType: 'subscription', entityId: '4', entityName: 'Подписка Анна Морозова', action: 'create', userId: '1', userName: 'Иван Петров', timestamp: '2024-02-15T13:45:00Z' },
  { id: '4', entityType: 'bot', entityId: '4', entityName: 'Промо бот', action: 'edit', userId: '1', userName: 'Иван Петров', timestamp: '2024-02-15T12:00:00Z' },
  { id: '5', entityType: 'plan', entityId: '5', entityName: 'Пробный', action: 'create', userId: '1', userName: 'Иван Петров', timestamp: '2024-02-15T10:30:00Z' },
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
  
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const todayPayments = payments.filter(p => {
    const paymentDate = new Date(p.createdAt).toDateString();
    return paymentDate === new Date().toDateString() && p.status === 'completed';
  }).length;
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

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
  name: 'Иван Петров',
  email: 'admin@example.com',
  role: 'admin',
  avatar: undefined,
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
