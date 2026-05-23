import api from '@/lib/api';
import { Roadblock } from '../types';

export const monitoringService = {
    /**
     * Fetch all active company roadblocks
     */
    async getRoadblocks(): Promise<Roadblock[]> {
        const { data } = await api.get('/admin/road-alerts');
        return data.data;
    },

    /**
     * Create a new roadblock
     */
    async createRoadblock(payload: {
        lat: number;
        lng: number;
        type: string;
        description?: string;
    }): Promise<Roadblock> {
        const { data } = await api.post('/admin/road-alerts', payload);
        return data.data;
    },

    /**
     * Resolve (delete) a roadblock
     */
    async resolveRoadblock(id: string | number): Promise<void> {
        await api.delete(`/admin/road-alerts/${id}`);
    }
};
