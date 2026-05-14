import api from '@/lib/api';
import { Company } from '@/domains/system/services/companyService';

export interface Location {
    id: string;
    company_id: string;
    code: string | null;
    name: string;
    type: 'main_sort' | 'regional_hub' | 'local_node';
    location: string | null; // WKT point
    geofence: string | null; // WKT polygon
    company?: Company;
    created_at: string;
    updated_at: string;
    // For form handling
    latitude?: number;
    longitude?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export const locationService = {
    getLocations: async (params: any) => {
        const response = await api.get<PaginatedResponse<Location>>(`/fleet/locations`, {
            params
        });
        return response.data;
    },
    getLocation: async (id: string) => {
        const response = await api.get<Location>(`/fleet/locations/${id}`);
        return response.data;
    },
    createLocation: async (data: Partial<Location>) => {
        const response = await api.post('/fleet/locations', data);
        return response.data;
    },
    updateLocation: async (id: string, data: Partial<Location>) => {
        const response = await api.post(`/fleet/locations/${id}`, {
            ...data,
            _method: 'PUT'
        });
        return response.data;
    },
    deleteLocation: async (id: string) => {
        const response = await api.delete(`/fleet/locations/${id}`);
        return response.data;
    },
};
