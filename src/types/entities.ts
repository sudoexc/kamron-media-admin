// Entity types for the admin panel

export interface Bot {
  id: string | number;
  title: string;
  username: string;
  notification_group_id: number;
  bot_token: string;
  request_port: number | null;
  created_at?: string;
}

export interface SubscriptionPlan {
  id: string | number;
  name: string;
  duration_days: number;
  price_usdt: string;
  price_uzs: string;
  price_stars: string;
  price_rub: string;
  is_active: boolean;
  bot: number;
  created_at?: string;
}

export interface BotPlanLink {
  id?: string | number;
  bot_id: number;
  plan_id: number;
  plan?: SubscriptionPlan | number;
  created_at?: string;
}

export interface Payment {
  id: string | number;
  user: User | number;
  bot: Bot | number;
  subscription?: Subscription | number | null;
  method: string;
  amount: string;
  status: string;
  transaction_id?: string | null;
  created_at?: string;
}

export type SubscriptionRef =
  | number
  | {
      id?: number;
      telegram_id?: number;
      title?: string;
      name?: string;
      username?: string;
    };

export interface Subscription {
  id: string | number;
  user: SubscriptionRef;
  bot: SubscriptionRef;
  plan: SubscriptionRef;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface User {
  id?: number;
  telegram_id: number;
  language: string;
  is_active: boolean;
  created_at?: string;
}

export interface Message {
  id: string | number;
  identifier: string;
  message_ru: string;
  message_en: string;
  message_uz: string;
  created_at?: string;
}

export interface PaymentMethod {
  id?: string | number;
  title?: string;
  name?: string;
  code?: string;
  provider?: string;
  callback_data?: string;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
}

export interface Group {
  id: string;
  name: string;
  permissionsCount: number;
  createdAt: string;
}

export interface RecentAction {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  action: 'create' | 'edit' | 'delete';
  userId: string;
  userName: string;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  todayPayments: number;
  totalRevenue: number;
  totalPayments?: number;
  userGrowth: number;
  subscriptionGrowth: number;
  paymentGrowth: number;
  revenueGrowth: number;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// Auth types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  avatar?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}
