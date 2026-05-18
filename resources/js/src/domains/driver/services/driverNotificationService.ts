import api from '@/lib/api';
import { PaginatedResponse } from '../../system/services/userService';

export interface DbNotification {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: {
        task_id: string;
        title: string;
        description?: string;
        priority: string;
        status: string;
        scheduled_at?: string;
    };
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export const driverNotificationService = {
    /**
     * Get paginated notifications for the driver
     */
    getNotifications: async (params: any = {}): Promise<PaginatedResponse<DbNotification>> => {
        const { data } = await api.get('/driver/notifications', { params });
        return data;
    },

    /**
     * Mark a specific notification as read
     */
    markAsRead: async (id: string): Promise<DbNotification> => {
        const { data } = await api.post(`/driver/notifications/${id}/read`);
        return data.data;
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<void> => {
        await api.post('/driver/notifications/read-all');
    },

    /**
     * Delete an individual notification
     */
    deleteNotification: async (id: string): Promise<void> => {
        await api.delete(`/driver/notifications/${id}`);
    },

    /**
     * Delete all notifications
     */
    deleteAllNotifications: async (): Promise<void> => {
        await api.delete('/driver/notifications/all');
    }
};
