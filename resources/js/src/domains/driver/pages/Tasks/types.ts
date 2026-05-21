import { Task } from '@/domains/admin/pages/Tasks/services/taskService';

export type ActiveTask = Task;

export interface TaskCardProps {
    task: ActiveTask;
    t: (key: string) => string;
    onStatusChange: (taskId: string, currentStatus: string) => void;
    isUpdating: boolean;
    updatingTaskId?: string;
}
