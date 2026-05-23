import api from '@/lib/api';
import { PaginatedResponse } from '../../../../system/services/userService';
import { DbNotification } from '../types';

export const driverNotificationService = {
    /**
     * Get paginated notifications for the driver
     */
    async getNotifications(params: any = {}): Promise<PaginatedResponse<DbNotification>> {
        const { data } = await api.get('/driver/notifications', { params });
        return data;
    },

    /**
     * Mark a specific notification as read
     */
    async markAsRead(id: string): Promise<DbNotification> {
        const { data } = await api.post(`/driver/notifications/${id}/read`);
        return data.data;
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        await api.post('/driver/notifications/read-all');
    },

    /**
     * Delete an individual notification
     */
    async deleteNotification(id: string): Promise<void> {
        await api.delete(`/driver/notifications/${id}`);
    },

    /**
     * Delete all notifications
     */
    async deleteAllNotifications(): Promise<void> {
        await api.delete('/driver/notifications/all');
    }
};

export default driverNotificationService;
