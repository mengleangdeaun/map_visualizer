import api from '@/lib/api';

export interface Company {
    id: string;
    name: string;
    tax_id: string | null;
    base_currency: string;
    telegram_user_id: string | null;
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

export const companyService = {
    getCompanies: async (page = 1, perPage = 10, search?: string) => {
        const response = await api.get<PaginatedResponse<Company>>(`/system/companies`, {
            params: { page, per_page: perPage, search }
        });
        return response.data;
    },
    getCompany: async (id: string) => {
        const response = await api.get<Company>(`/system/companies/${id}`);
        return response.data;
    },
    createCompany: async (data: Partial<Company>) => {
        const response = await api.post('/system/companies', data);
        return response.data;
    },
    updateCompany: async (id: string, data: Partial<Company>) => {
        const response = await api.put(`/system/companies/${id}`, data);
        return response.data;
    },
    deleteCompany: async (id: string) => {
        const response = await api.delete(`/system/companies/${id}`);
        return response.data;
    },
};
