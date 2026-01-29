import { addRecentAction, mockAuthUser } from '@/api/mockData';
import { RecentAction } from '@/types/entities';

type LogActionInput = Omit<RecentAction, 'id' | 'timestamp' | 'userId' | 'userName'>;

export const logRecentAction = (action: LogActionInput): void => {
  addRecentAction({
    ...action,
    userId: mockAuthUser.id,
    userName: mockAuthUser.name,
  });
};
