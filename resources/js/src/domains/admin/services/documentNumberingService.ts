import api from '@/lib/api';

export interface DocumentNumberSetting {
    id: string;
    company_id: string;
    name: string;
    prefix: string | null;
    suffix: string | null;
    date_format: 'None' | 'YYYY' | 'YY' | 'YYYYMM' | 'YYYYMMDD';
    separator: '-' | '/' | '_' | 'None' | null;
    digit_padding: number;
    next_number: number;
    reset_frequency: 'None' | 'Daily' | 'Monthly' | 'Yearly';
    sequence_scope: string | null;
    template: string;
    is_active: boolean;
    last_reset_at: string | null;
    created_at: string;
    updated_at: string;
    company?: { name: string };
}

export interface PaginatedDocumentNumberSettings {
    data: DocumentNumberSetting[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
}

export const documentNumberingService = {
    list: async (params: any) => {
        const { data } = await api.get<PaginatedDocumentNumberSettings>('/admin/fleet/document-number-settings', { params });
        return data;
    },

    get: async (id: string) => {
        const { data } = await api.get<DocumentNumberSetting>(`/admin/fleet/document-number-settings/${id}`);
        return data;
    },

    create: async (payload: Partial<DocumentNumberSetting>) => {
        const { data } = await api.post<DocumentNumberSetting>('/admin/fleet/document-number-settings', payload);
        return data;
    },

    update: async (id: string, payload: Partial<DocumentNumberSetting>) => {
        const { data } = await api.post<DocumentNumberSetting>(`/admin/fleet/document-number-settings/${id}`, {
            ...payload,
            _method: 'PUT'
        });
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/admin/fleet/document-number-settings/${id}`);
    },

    generate: async (id: string) => {
        const { data } = await api.post<{ number: string; data: DocumentNumberSetting }>(`/admin/fleet/document-number-settings/${id}/generate`);
        return data;
    }
};
