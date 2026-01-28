import { MOCK_MODE, apiClient, mockDelay } from './client';
import { PaginatedResponse } from '@/types/entities';
import {
  Bot,
  SubscriptionPlan,
  Payment,
  Subscription,
  User,
  Message,
  PaymentMethod,
  Group,
} from '@/types/entities';
import {
  getMockBots,
  setMockBots,
  getMockPlans,
  setMockPlans,
  getMockPayments,
  setMockPayments,
  getMockSubscriptions,
  setMockSubscriptions,
  getMockUsers,
  setMockUsers,
  getMockMessages,
  setMockMessages,
  getMockPaymentMethods,
  setMockPaymentMethods,
  getMockGroups,
  setMockGroups,
  generateId,
  addRecentAction,
  mockAuthUser,
} from './mockData';

// Generic CRUD factory for mock mode
function createMockCrud<T extends { id: string; createdAt?: string }>(
  entityType: string,
  getData: () => T[],
  setData: (data: T[]) => void,
  getEntityName: (item: T) => string
) {
  return {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }): Promise<PaginatedResponse<T>> => {
      await mockDelay();
      let data = getData();

      // Search filter
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        data = data.filter((item) =>
          Object.values(item).some(
            (val) =>
              typeof val === 'string' && val.toLowerCase().includes(searchLower)
          )
        );
      }

      // Sort
      if (params?.sortBy) {
        data = [...data].sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[params.sortBy!];
          const bVal = (b as Record<string, unknown>)[params.sortBy!];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return params.sortOrder === 'desc'
              ? bVal.localeCompare(aVal)
              : aVal.localeCompare(bVal);
          }
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return params.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
          }
          return 0;
        });
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = data.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedData = data.slice(startIndex, startIndex + limit);

      return {
        data: paginatedData,
        total,
        page,
        limit,
        totalPages,
      };
    },

    getById: async (id: string): Promise<T | null> => {
      await mockDelay();
      const data = getData();
      return data.find((item) => item.id === id) || null;
    },

    create: async (item: Omit<T, 'id' | 'createdAt'>): Promise<T> => {
      await mockDelay(300);
      const data = getData();
      const newItem = {
        ...item,
        id: generateId(),
        createdAt: new Date().toISOString(),
      } as T;
      setData([newItem, ...data]);

      addRecentAction({
        entityType,
        entityId: newItem.id,
        entityName: getEntityName(newItem),
        action: 'create',
        userId: mockAuthUser.id,
        userName: mockAuthUser.name,
      });

      return newItem;
    },

    update: async (id: string, updates: Partial<T>): Promise<T> => {
      await mockDelay(300);
      const data = getData();
      const index = data.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error('Элемент не найден');
      }
      const updatedItem = { ...data[index], ...updates };
      data[index] = updatedItem;
      setData([...data]);

      addRecentAction({
        entityType,
        entityId: updatedItem.id,
        entityName: getEntityName(updatedItem),
        action: 'edit',
        userId: mockAuthUser.id,
        userName: mockAuthUser.name,
      });

      return updatedItem;
    },

    delete: async (id: string): Promise<void> => {
      await mockDelay(300);
      const data = getData();
      const item = data.find((i) => i.id === id);
      if (item) {
        addRecentAction({
          entityType,
          entityId: id,
          entityName: getEntityName(item),
          action: 'delete',
          userId: mockAuthUser.id,
          userName: mockAuthUser.name,
        });
      }
      setData(data.filter((item) => item.id !== id));
    },
  };
}

// Entity APIs
export const botsApi = MOCK_MODE
  ? createMockCrud<Bot>('bot', getMockBots, setMockBots, (b) => b.name)
  : {
      getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<PaginatedResponse<Bot>>('/bots', { params }).then((r) => r.data),
      getById: (id: string) => apiClient.get<Bot>(`/bots/${id}`).then((r) => r.data),
      create: (data: Omit<Bot, 'id' | 'createdAt'>) => apiClient.post<Bot>('/bots', data).then((r) => r.data),
      update: (id: string, data: Partial<Bot>) => apiClient.patch<Bot>(`/bots/${id}`, data).then((r) => r.data),
      delete: (id: string) => apiClient.delete(`/bots/${id}`).then(() => undefined),
    };

export const plansApi = MOCK_MODE
  ? createMockCrud<SubscriptionPlan>('plan', getMockPlans, setMockPlans, (p) => p.title)
  : {
      getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<PaginatedResponse<SubscriptionPlan>>('/subscription-plans', { params }).then((r) => r.data),
      getById: (id: string) => apiClient.get<SubscriptionPlan>(`/subscription-plans/${id}`).then((r) => r.data),
      create: (data: Omit<SubscriptionPlan, 'id' | 'createdAt'>) =>
        apiClient.post<SubscriptionPlan>('/subscription-plans', data).then((r) => r.data),
      update: (id: string, data: Partial<SubscriptionPlan>) =>
        apiClient.patch<SubscriptionPlan>(`/subscription-plans/${id}`, data).then((r) => r.data),
      delete: (id: string) => apiClient.delete(`/subscription-plans/${id}`).then(() => undefined),
    };

export const paymentsApi = MOCK_MODE
  ? createMockCrud<Payment>('payment', getMockPayments, setMockPayments, (p) => `Оплата #${p.id}`)
  : {
      getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<PaginatedResponse<Payment>>('/payments', { params }).then((r) => r.data),
      getById: (id: string) => apiClient.get<Payment>(`/payments/${id}`).then((r) => r.data),
      create: (data: Omit<Payment, 'id' | 'createdAt'>) =>
        apiClient.post<Payment>('/payments', data).then((r) => r.data),
      update: (id: string, data: Partial<Payment>) =>
        apiClient.patch<Payment>(`/payments/${id}`, data).then((r) => r.data),
      delete: (id: string) => apiClient.delete(`/payments/${id}`).then(() => undefined),
    };

export const subscriptionsApi = MOCK_MODE
  ? createMockCrud<Subscription>('subscription', getMockSubscriptions, setMockSubscriptions, (s) => `Подписка ${s.userName || s.userId}`)
  : {
      getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<PaginatedResponse<Subscription>>('/subscriptions', { params }).then((r) => r.data),
      getById: (id: string) => apiClient.get<Subscription>(`/subscriptions/${id}`).then((r) => r.data),
      create: (data: Omit<Subscription, 'id'>) =>
        apiClient.post<Subscription>('/subscriptions', data).then((r) => r.data),
      update: (id: string, data: Partial<Subscription>) =>
        apiClient.patch<Subscription>(`/subscriptions/${id}`, data).then((r) => r.data),
      delete: (id: string) => apiClient.delete(`/subscriptions/${id}`).then(() => undefined),
    };

export const usersApi = MOCK_MODE
  ? createMockCrud<User>('user', getMockUsers, setMockUsers, (u) => u.name)
  : {
      getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data),
      getById: (id: string) => apiClient.get<User>(`/users/${id}`).then((r) => r.data),
      create: (data: Omit<User, 'id' | 'createdAt'>) =>
        apiClient.post<User>('/users', data).then((r) => r.data),
      update: (id: string, data: Partial<User>) =>
        apiClient.patch<User>(`/users/${id}`, data).then((r) => r.data),
      delete: (id: string) => apiClient.delete(`/users/${id}`).then(() => undefined),
    };

export const messagesApi = MOCK_MODE
  ? createMockCrud<Message>('message', getMockMessages, setMockMessages, (m) => m.text.slice(0, 30))
  : {
      getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<PaginatedResponse<Message>>('/messages', { params }).then((r) => r.data),
      getById: (id: string) => apiClient.get<Message>(`/messages/${id}`).then((r) => r.data),
      create: (data: Omit<Message, 'id' | 'createdAt'>) =>
        apiClient.post<Message>('/messages', data).then((r) => r.data),
      update: (id: string, data: Partial<Message>) =>
        apiClient.patch<Message>(`/messages/${id}`, data).then((r) => r.data),
      delete: (id: string) => apiClient.delete(`/messages/${id}`).then(() => undefined),
    };

export const paymentMethodsApi = MOCK_MODE
  ? createMockCrud<PaymentMethod>('payment_method', getMockPaymentMethods, setMockPaymentMethods, (pm) => pm.title)
  : {
      getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<PaginatedResponse<PaymentMethod>>('/payment-methods', { params }).then((r) => r.data),
      getById: (id: string) => apiClient.get<PaymentMethod>(`/payment-methods/${id}`).then((r) => r.data),
      create: (data: Omit<PaymentMethod, 'id' | 'createdAt'>) =>
        apiClient.post<PaymentMethod>('/payment-methods', data).then((r) => r.data),
      update: (id: string, data: Partial<PaymentMethod>) =>
        apiClient.patch<PaymentMethod>(`/payment-methods/${id}`, data).then((r) => r.data),
      delete: (id: string) => apiClient.delete(`/payment-methods/${id}`).then(() => undefined),
    };

export const groupsApi = MOCK_MODE
  ? createMockCrud<Group>('group', getMockGroups, setMockGroups, (g) => g.name)
  : {
      getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<PaginatedResponse<Group>>('/groups', { params }).then((r) => r.data),
      getById: (id: string) => apiClient.get<Group>(`/groups/${id}`).then((r) => r.data),
      create: (data: Omit<Group, 'id' | 'createdAt'>) =>
        apiClient.post<Group>('/groups', data).then((r) => r.data),
      update: (id: string, data: Partial<Group>) =>
        apiClient.patch<Group>(`/groups/${id}`, data).then((r) => r.data),
      delete: (id: string) => apiClient.delete(`/groups/${id}`).then(() => undefined),
    };
