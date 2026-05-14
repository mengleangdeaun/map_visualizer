import api from '@/lib/api';

export interface Vehicle {
    id: string;
    company_id: string;
    driver_id: string | null;
    type: 'motorcycle' | 'tuktuk' | 'minivan' | 'box_truck';
    plate_number: string;
    max_weight_kg: number | null;
    max_volume_cbm: number | null;
    image_url: string | null;
    is_active: boolean;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
    company?: { name: string };
    driver?: { name: string; phone?: string };
}

export interface PaginatedVehicles {
    data: Vehicle[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
}

export const vehicleService = {
    list: async (params: any) => {
        const { data } = await api.get<PaginatedVehicles>('/admin/fleet/vehicles', { params });
        return data;
    },

    get: async (id: string) => {
        const { data } = await api.get<Vehicle>(`/admin/fleet/vehicles/${id}`);
        return data;
    },

    create: async (payload: Partial<Vehicle>) => {
        const { data } = await api.post<Vehicle>('/admin/fleet/vehicles', payload);
        return data;
    },

    update: async (id: string, payload: Partial<Vehicle>) => {
        // Using POST with _method spoofing to avoid Symfony request body issues if present
        const { data } = await api.post<Vehicle>(`/admin/fleet/vehicles/${id}`, {
            ...payload,
            _method: 'PUT'
        });
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/admin/fleet/vehicles/${id}`);
    },

    updateLocation: async (id: string, lat: number, lng: number) => {
        const { data } = await api.patch<Vehicle>(`/admin/fleet/vehicles/${id}/location`, {
            latitude: lat,
            longitude: lng
        });
        return data;
    }
};
