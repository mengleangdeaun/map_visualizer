import api from '@/lib/api';
import { ActiveRoute } from '../types';

export const deliveryService = {
    /**
     * Fetch the active route and stops for the currently authenticated driver
     */
    getActiveRoute: async (): Promise<ActiveRoute | null> => {
        const { data } = await api.get('/driver/route/active');
        return data.data;
    },

    /**
     * Mark a specific route stop as arrived
     */
    confirmArrival: async (stopId: string): Promise<any> => {
        const { data } = await api.post(`/driver/route/stops/${stopId}/arrive`);
        return data;
    }
};
