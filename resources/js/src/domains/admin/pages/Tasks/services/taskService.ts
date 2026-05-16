import api from '@/lib/api';

export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'archived';

export interface Task {
    id: string;
    company_id: string;
    vehicle_id: string | null;
    driver_id: string | null;
    title: string;
    description: string | null;
    status: TaskStatus;
    contact_name: string | null;
    contact_phone: string | null;
    pickup_lat: number | null;
    pickup_lng: number | null;
    dropoff_lat: number | null;
    dropoff_lng: number | null;
    pickup_address: string | null;
    dropoff_address: string | null;
    scheduled_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    vehicle?: { plate_number: string };
    driver?: { name: string };
}

export interface PaginatedTasks {
    data: Task[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
}

export const taskService = {
    list: async (params: any) => {
        const { data } = await api.get<PaginatedTasks>('/admin/fleet/tasks', { params });
        return data;
    },

    get: async (id: string) => {
        const { data } = await api.get<Task>(`/admin/fleet/tasks/${id}`);
        return data;
    },

    create: async (payload: Partial<Task>) => {
        const { data } = await api.post<Task>('/admin/fleet/tasks', payload);
        return data;
    },

    update: async (id: string, payload: Partial<Task>) => {
        const { data } = await api.post<Task>(`/admin/fleet/tasks/${id}`, {
            ...payload,
            _method: 'PUT'
        });
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/admin/fleet/tasks/${id}`);
    }
};
