import api from '@/lib/api';
import { Company } from './companyService';

export interface User {
    id: string;
    company_id: string | null;
    role: 'super_admin' | 'system_staff' | 'admin' | 'dispatcher' | 'hub_operator' | 'driver';
    name: string;
    phone: string;
    email: string | null;
    telegram_user_id: string | null;
    base_hub_id: string | null;
    status: 'active' | 'suspended' | 'inactive';
    operational_status: 'offline' | 'online' | 'busy';
    profile_url: string | null;
    profile_full_url: string | null;
    permissions: Record<string, boolean> | null;
    company?: Company;
    hub?: import('../../fleet/services/locationService').Location;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export const userService = {
    getUsers: async (params: any) => {
        const response = await api.get<PaginatedResponse<User>>(`/system/users`, {
            params
        });
        return response.data;
    },
    getUser: async (id: string) => {
        const response = await api.get<User>(`/system/users/${id}`);
        return response.data;
    },
    createUser: async (data: FormData | Partial<User>) => {
        const response = await api.post('/system/users', data);
        return response.data;
    },
    updateUser: async (id: string, data: FormData | Partial<User>) => {
        const finalData = data instanceof FormData ? data : { ...data, _method: 'PUT' };
        if (data instanceof FormData && !data.has('_method')) {
            data.append('_method', 'PUT');
        }
        const response = await api.post(`/system/users/${id}`, finalData);
        return response.data;
    },
    deleteUser: async (id: string) => {
        const response = await api.delete(`/system/users/${id}`);
        return response.data;
    },
};
