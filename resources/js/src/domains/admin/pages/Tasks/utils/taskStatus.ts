import { TaskStatus } from '@/domains/admin/utils/statusStyles';
import { getTaskStatusStyle } from '@/domains/admin/utils/statusStyles';

export const getTaskStatusColor = (status: TaskStatus): string => {
    return getTaskStatusStyle(status);
};
