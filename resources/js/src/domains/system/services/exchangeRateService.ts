import api from '@/lib/api';
import { Company } from './companyService';

export interface ExchangeRate {
    id: string;
    company_id: string;
    from_currency: string;
    to_currency: string;
    rate: number;
    effective_date: string;
    company?: Company;
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

export const exchangeRateService = {
    getExchangeRates: async (params: any) => {
        const response = await api.get<PaginatedResponse<ExchangeRate>>(`/system/exchange-rates`, {
            params
        });
        return response.data;
    },
    getExchangeRate: async (id: string) => {
        const response = await api.get<ExchangeRate>(`/system/exchange-rates/${id}`);
        return response.data;
    },
    createExchangeRate: async (data: Partial<ExchangeRate>) => {
        const response = await api.post('/system/exchange-rates', data);
        return response.data;
    },
    updateExchangeRate: async (id: string, data: Partial<ExchangeRate>) => {
        const response = await api.put(`/system/exchange-rates/${id}`, data);
        return response.data;
    },
    deleteExchangeRate: async (id: string) => {
        const response = await api.delete(`/system/exchange-rates/${id}`);
        return response.data;
    },
};
