import api from '@/lib/api';
import { Task } from '@/domains/admin/pages/Tasks/services/taskService';
import { PaginatedResponse } from '@/domains/system/services/userService';

export const taskService = {
    /**
     * Get active tasks assigned to the driver
     */
    getActiveTasks: async (params: any = {}): Promise<PaginatedResponse<Task>> => {
        const { data } = await api.get('/driver/tasks', { params });
        return data;
    },

    /**
     * Update task status (Start task, Complete task)
     */
    updateStatus: async (taskId: string, status: string, additionalData: any = {}): Promise<Task> => {
        const { data } = await api.patch(`/driver/tasks/${taskId}/status`, {
            status,
            ...additionalData
        });
        return data.data;
    }
};
