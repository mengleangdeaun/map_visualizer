import api from '@/lib/api';
import { HistoricalRoute, PaginatedResponse } from '../pages/DeliveryHistory/types';

export const driverDeliveryService = {
    /**
     * Get paginated route and stop execution history for the current driver.
     */
    getRouteHistory: async (params: {
        page?: number;
        date?: string;
        status?: string;
    } = {}): Promise<PaginatedResponse<HistoricalRoute>> => {
        const { data } = await api.get('/driver/route/history', { params });
        return data;
    }
};
