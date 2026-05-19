import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface SystemSettings {
    exchange_rate_current_value: string;
    exchange_rate_last_sync: string;
    exchange_rate_mode: 'auto' | 'manual';
    exchange_rate_manual_value: string;
    exchange_rate_provider_url: string;
    exchange_rate_provider_type: string;
    exchange_rate_api_key: string | null;
    exchange_rate_data_path: 'average' | 'bid' | 'ask';
}

export const useSystemSettings = () => {
    return useQuery({
        queryKey: ['system-settings'],
        queryFn: async () => {
            const response = await api.get<Record<keyof SystemSettings, string>>('/system/settings');
            return response.data;
        },
    });
};

export const useUpdateSystemSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<SystemSettings>) => {
            const response = await api.put<{ message: string; data: Record<keyof SystemSettings, string> }>(
                '/system/settings',
                data
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['system-settings'], data.data);
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            toast.success(data.message || 'System settings saved successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update system settings');
        }
    });
};

export const useSyncExchangeRate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await api.post<{
                success: boolean;
                message: string;
                current_value: number;
                last_sync: string;
            }>('/system/settings/sync');
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
            toast.success(data.message || 'Exchange rate synchronized successfully from NBC!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to synchronize exchange rate from NBC');
        }
    });
};
