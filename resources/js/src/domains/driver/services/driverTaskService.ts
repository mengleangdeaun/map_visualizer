import api from '@/lib/api';
import { Task } from '../../admin/services/taskService';
import { PaginatedResponse } from '../../system/services/userService';

export const driverTaskService = {
    /**
     * Get assigned tasks for the driver
     */
    getTasks: async (params: any = {}): Promise<PaginatedResponse<Task>> => {
        const { data } = await api.get('/driver/tasks', { params });
        return data;
    },

    /**
     * Update task status (Start, Complete, etc.)
     */
    updateStatus: async (taskId: string, status: string, additionalData: any = {}): Promise<Task> => {
        const { data } = await api.patch(`/driver/tasks/${taskId}/status`, {
            status,
            ...additionalData
        });
        return data.data;
    },

    /**
     * Report current location
     */
    reportLocation: async (latitude: number, longitude: number, speed?: number): Promise<void> => {
        await api.patch('/driver/location', {
            latitude,
            longitude,
            speed
        });
    }
};
