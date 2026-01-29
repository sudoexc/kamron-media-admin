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
  getMockGroups,
  setMockGroups,
  generateId,
  addRecentAction,
  mockAuthUser,
} from './mockData';

const normalizePaginatedResponse = <T>(
  payload: unknown
): PaginatedResponse<T> => {
  if (Array.isArray(payload)) {
    return {
      data: payload as T[],
      total: payload.length,
      page: 1,
      limit: payload.length,
      totalPages: 1,
    };
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      const data = record.data as T[];
      const total = Number(record.total ?? data.length);
      const limit = Number(record.limit ?? data.length);
      const totalPages =
        Number(record.totalPages ?? (limit ? Math.ceil(total / limit) : 1)) || 1;
      return {
        data,
        total,
        page: Number(record.page ?? 1) || 1,
        limit,
        totalPages,
      };
    }
    if (Array.isArray(record.results)) {
      const data = record.results as T[];
      const total = Number(record.count ?? data.length);
      const limit = Number(record.limit ?? data.length);
      const totalPages = limit ? Math.ceil(total / limit) : 1;
      return {
        data,
        total,
        page: Number(record.page ?? 1) || 1,
        limit,
        totalPages,
      };
    }
  }

  return {
    data: [],
    total: 0,
    page: 1,
    limit: 0,
    totalPages: 1,
  };
};

// Generic CRUD factory for mock mode
function createMockCrud<T extends { id: string | number; createdAt?: string; created_at?: string }>(
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
export const botsApi = {
  getAll: () => apiClient.get<Bot[]>('/bots/').then((r) => r.data),
  getById: (id: string | number) => apiClient.get<Bot>(`/bots/${id}/`).then((r) => r.data),
  create: (data: Omit<Bot, 'id' | 'created_at'>) => apiClient.post<Bot>('/bots/', data).then((r) => r.data),
  update: (id: string | number, data: Partial<Bot>) => apiClient.patch<Bot>(`/bots/${id}/`, data).then((r) => r.data),
  delete: (id: string | number) => apiClient.delete(`/bots/${id}/`).then(() => undefined),
};

export const plansApi = {
  getAll: () => apiClient.get<SubscriptionPlan[]>('/plans/').then((r) => r.data),
  getById: (id: string | number) => apiClient.get<SubscriptionPlan>(`/plans/${id}/`).then((r) => r.data),
  create: (data: Omit<SubscriptionPlan, 'id' | 'created_at'>) =>
    apiClient.post<SubscriptionPlan>('/plans/', data).then((r) => r.data),
  update: (id: string | number, data: Partial<SubscriptionPlan>) =>
    apiClient.patch<SubscriptionPlan>(`/plans/${id}/`, data).then((r) => r.data),
  delete: (id: string | number) => apiClient.delete(`/plans/${id}/`).then(() => undefined),
};

export const paymentsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    apiClient
      .get<Payment[] | PaginatedResponse<Payment>>('/payments/', { params })
      .then((r) => normalizePaginatedResponse<Payment>(r.data)),
  getById: (id: string | number) =>
    apiClient.get<Payment>(`/payments/${id}/`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    apiClient.post<Payment>('/payments/', data).then((r) => r.data),
  update: (id: string | number, data: Record<string, unknown>) =>
    apiClient.patch<Payment>(`/payments/${id}/`, data).then((r) => r.data),
  delete: (id: string | number) =>
    apiClient.delete(`/payments/${id}/`).then(() => undefined),
};

export const subscriptionsApi = {
  getAll: () => apiClient.get<Subscription[]>('/subscriptions/').then((r) => r.data),
  getById: (id: string | number) =>
    apiClient.get<Subscription>(`/subscriptions/${id}/`).then((r) => r.data),
  create: (data: Omit<Subscription, 'id' | 'created_at'>) =>
    apiClient.post<Subscription>('/subscriptions/', data).then((r) => r.data),
  update: (id: string | number, data: Partial<Subscription>) =>
    apiClient.patch<Subscription>(`/subscriptions/${id}/`, data).then((r) => r.data),
  delete: (id: string | number) =>
    apiClient.delete(`/subscriptions/${id}/`).then(() => undefined),
};

export const usersApi = {
  getAll: () => apiClient.get<User[]>('/users/').then((r) => r.data),
  getById: (telegramId: string | number) =>
    apiClient.get<User>(`/users/${telegramId}/`).then((r) => r.data),
  create: (data: User) => apiClient.post<User>('/users/', data).then((r) => r.data),
  update: (telegramId: string | number, data: Partial<User>) =>
    apiClient.patch<User>(`/users/${telegramId}/`, data).then((r) => r.data),
  delete: (telegramId: string | number) =>
    apiClient.delete(`/users/${telegramId}/`).then(() => undefined),
};

export const messagesApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient
      .get<Message[] | PaginatedResponse<Message>>('/messages/', { params })
      .then((r) => normalizePaginatedResponse<Message>(r.data)),
  getById: (id: string | number) =>
    apiClient.get<Message>(`/messages/${id}/`).then((r) => r.data),
  create: (data: Partial<Message>) =>
    apiClient.post<Message>('/messages/', data).then((r) => r.data),
  update: (id: string | number, data: Partial<Message>) =>
    apiClient.patch<Message>(`/messages/${id}/`, data).then((r) => r.data),
  delete: (id: string | number) =>
    apiClient.delete(`/messages/${id}/`).then(() => undefined),
};

export const paymentMethodsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient
      .get<PaymentMethod[] | PaginatedResponse<PaymentMethod>>('/methods/', { params })
      .then((r) => normalizePaginatedResponse<PaymentMethod>(r.data)),
  getById: (id: string | number) =>
    apiClient.get<PaymentMethod>(`/methods/${id}/`).then((r) => r.data),
  create: (data: Partial<PaymentMethod>) =>
    apiClient.post<PaymentMethod>('/methods/', data).then((r) => r.data),
  update: (id: string | number, data: Partial<PaymentMethod>) =>
    apiClient.patch<PaymentMethod>(`/methods/${id}/`, data).then((r) => r.data),
  delete: (id: string | number) =>
    apiClient.delete(`/methods/${id}/`).then(() => undefined),
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
