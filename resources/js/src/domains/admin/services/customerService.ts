import api from '@/lib/api';

export interface Customer {
    id: string;
    company_id: string;
    name: string;
    phone: string;
    email?: string;
    default_address?: string;
    created_at: string;
    updated_at: string;
}

export interface PaginatedCustomers {
    data: Customer[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

export const customerService = {
    list: async (params: any = {}): Promise<PaginatedCustomers> => {
        const { data } = await api.get<PaginatedCustomers>('/admin/fleet/customers', { params });
        return data;
    },

    create: async (data: Partial<Customer>): Promise<Customer> => {
        const response = await api.post('/admin/fleet/customers', data);
        return response.data.data;
    },

    update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
        const response = await api.put(`/admin/fleet/customers/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/admin/fleet/customers/${id}`);
    },
};
