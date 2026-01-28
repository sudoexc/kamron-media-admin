// Entity types for the admin panel

export interface Bot {
  id: string;
  name: string;
  username: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: number;
  periodDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  userName?: string;
  planId: string;
  planTitle?: string;
  startAt: string;
  endAt: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: string;
}

export interface Message {
  id: string;
  userId: string;
  userName?: string;
  text: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  title: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
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
  email: string;
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
