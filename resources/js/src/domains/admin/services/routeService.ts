import api from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RouteStop {
    id: string;
    route_id: string;
    delivery_id: string;
    sequence_number: number;
    eta: string | null;
    arrived_at: string | null;
    completed_at: string | null;
    status: 'pending' | 'in_transit' | 'arrived' | 'completed' | 'skipped';
    notes: string | null;
    leg_distance_km: number | null;
    leg_duration_min: number | null;
    leg_geometry: any | null; // GeoJSON LineString
    delivery?: {
        id: string;
        tracking_number: string;
        dropoff_address: string | null;
        dropoff_latitude: number | null;
        dropoff_longitude: number | null;
        status: string;
        weight_kg: number | null;
        driver_id: string | null;
        order?: any;
    };
    created_at: string;
    updated_at: string;
}

export interface Route {
    id: string;
    company_id: string;
    driver_id: string | null;
    hub_id: string | null;
    date: string;
    status: 'draft' | 'optimized' | 'in_progress' | 'completed' | 'cancelled';
    notes: string | null;
    total_weight_kg: number;
    stop_count: number;
    estimated_distance_km: number | null;
    estimated_duration_min: number | null;
    driver?: {
        id: string;
        name: string;
        phone: string;
        profile_photo_url?: string | null;
    };
    hub?: {
        id: string;
        name: string;
    };
    stops?: RouteStop[];
    created_at: string;
    updated_at: string;
}

export interface PaginatedRoutes {
    data: Route[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

// ── API Service ───────────────────────────────────────────────────────────────

const BASE = '/admin/fleet/routes';

export const routeService = {
    getRoutes: async (params: any = {}): Promise<PaginatedRoutes> => {
        const { data } = await api.get<PaginatedRoutes>(BASE, { params });
        return data;
    },

    getRoute: async (id: string): Promise<Route> => {
        const { data } = await api.get<{ data: Route }>(`${BASE}/${id}`);
        return data.data;
    },

    createRoute: async (payload: Partial<Route> & { delivery_ids?: string[] }): Promise<Route> => {
        const { data } = await api.post<{ data: Route }>(BASE, payload);
        return data.data;
    },

    updateRoute: async (id: string, payload: Partial<Route>): Promise<Route> => {
        const { data } = await api.put<{ data: Route }>(`${BASE}/${id}`, payload);
        return data.data;
    },

    deleteRoute: async (id: string): Promise<void> => {
        await api.delete(`${BASE}/${id}`);
    },

    addStops: async (routeId: string, deliveryIds: string[]): Promise<Route> => {
        const { data } = await api.post<{ data: Route }>(`${BASE}/${routeId}/stops`, {
            delivery_ids: deliveryIds,
        });
        return data.data;
    },

    removeStop: async (routeId: string, stopId: string): Promise<Route> => {
        const { data } = await api.delete<{ data: Route }>(`${BASE}/${routeId}/stops/${stopId}`);
        return data.data;
    },

    reorderStops: async (routeId: string, orderedDeliveryIds: string[]): Promise<Route> => {
        const { data } = await api.put<{ data: Route }>(`${BASE}/${routeId}/reorder`, {
            ordered_delivery_ids: orderedDeliveryIds,
        });
        return data.data;
    },

    optimizeRoute: async (routeId: string): Promise<Route> => {
        const { data } = await api.post<{ data: Route }>(`${BASE}/${routeId}/optimize`);
        return data.data;
    },

    publishRoute: async (routeId: string): Promise<Route> => {
        // Transition to in_progress — triggers Reverb broadcast to driver
        const { data } = await api.put<{ data: Route }>(`${BASE}/${routeId}`, {
            status: 'in_progress',
        });
        return data.data;
    },
};
