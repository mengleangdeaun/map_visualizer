import { Task } from '@/domains/admin/pages/Tasks/services/taskService';

export type PriorityType = 'all' | 'low' | 'normal' | 'high' | 'urgent';
export type StatusType = 'all' | 'completed' | 'cancelled';

export interface TaskFilterState {
  date: string;
  priority: PriorityType;
  status: StatusType;
}

export type HistoryTask = Task;

