import api from '@/lib/api';

export interface Company {
    id: string;
    name: string;
    slug: string;
    tax_id: string | null;
    base_currency: string;
    logo_url: string | null;
    logo_full_url: string | null;
    status: 'active' | 'inactive' | 'suspended';
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
    createCompany: async (data: FormData | Partial<Company>) => {
        const response = await api.post('/system/companies', data);
        return response.data;
    },
    updateCompany: async (id: string, data: FormData | Partial<Company>) => {
        // Use POST with _method=PUT for multipart/form-data support in Laravel
        const finalData = data instanceof FormData ? data : { ...data, _method: 'PUT' };
        if (data instanceof FormData && !data.has('_method')) {
            data.append('_method', 'PUT');
        }
        const response = await api.post(`/system/companies/${id}`, finalData);
        return response.data;
    },
    deleteCompany: async (id: string) => {
        const response = await api.delete(`/system/companies/${id}`);
        return response.data;
    },
};
