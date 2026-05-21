import api from '@/lib/api';
import { User } from '../types';

export const profileService = {
  /**
   * Fetch current driver's detailed profile.
   */
  getProfile: async (): Promise<{ data: User }> => {
    const { data } = await api.get('/me');
    return data;
  },

  /**
   * Save web push subscription details for dispatch alerts.
   */
  savePushSubscription: async (subscription: any): Promise<{ message: string }> => {
    const { data } = await api.post('/driver/profile/push-subscription', subscription);
    return data;
  },

  /**
   * Revoke/delete push notification subscription from active session.
   */
  deletePushSubscription: async (): Promise<{ message: string }> => {
    const { data } = await api.delete('/driver/profile/push-subscription');
    return data;
  },
};
