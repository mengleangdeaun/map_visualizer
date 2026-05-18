import api from '@/lib/api';
import { User } from '../../system/services/userService';

export interface PushSubscriptionPayload {
    endpoint: string;
    public_key?: string;
    auth_token?: string;
    device_type?: 'android' | 'ios' | 'desktop';
}

export const driverSettingsService = {
    /**
     * Upload a new profile picture.
     */
    updateProfilePicture: async (file: File): Promise<{ message: string; profile_url: string; profile_full_url: string }> => {
        const formData = new FormData();
        formData.append('profile_picture', file);

        const { data } = await api.post('/driver/profile/picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    /**
     * Request an email change - triggers verification code caching.
     */
    requestEmailChange: async (email: string): Promise<{ message: string; code: string; email: string }> => {
        const { data } = await api.post('/driver/profile/email/request', { email });
        return data;
    },

    /**
     * Confirm email change using the 6-digit verification code.
     */
    confirmEmailChange: async (code: string): Promise<{ message: string; user: User }> => {
        const { data } = await api.post('/driver/profile/email/confirm', { code });
        return data;
    },

    /**
     * Change current password.
     */
    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const { data } = await api.post('/driver/profile/password', {
            current_password: currentPassword,
            new_password: newPassword,
        });
        return data;
    },

    /**
     * Store push subscription (VAPID details) on the server.
     */
    savePushSubscription: async (payload: PushSubscriptionPayload): Promise<{ message: string }> => {
        const { data } = await api.post('/driver/profile/push-subscription', payload);
        return data;
    },

    /**
     * Delete push subscription from the server.
     */
    deletePushSubscription: async (endpoint: string): Promise<{ message: string }> => {
        const { data } = await api.delete('/driver/profile/push-subscription', {
            data: { endpoint }
        });
        return data;
    },
};
