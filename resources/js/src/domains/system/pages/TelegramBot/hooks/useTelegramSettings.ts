import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface TelegramSettings {
    id: string;
    company_id: string;
    bot_token: string | null;
    company_chat_id: string | null;
    notify_pwa: boolean;
    notify_driver_telegram: boolean;
    notify_company_telegram: boolean;
    created_at?: string;
    updated_at?: string;
}

export const useTelegramSettings = (companyId: string | null) => {
    return useQuery({
        queryKey: ['company-telegram-settings', companyId],
        queryFn: async () => {
            if (!companyId) return null;
            const response = await api.get<TelegramSettings>(`/system/companies/${companyId}/telegram-settings`);
            return response.data;
        },
        enabled: !!companyId,
    });
};

export const useUpdateTelegramSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ companyId, data }: { companyId: string; data: Partial<TelegramSettings> }) => {
            const response = await api.put<{ message: string; data: TelegramSettings }>(
                `/system/companies/${companyId}/telegram-settings`, 
                data
            );
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['company-telegram-settings', variables.companyId] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success('Telegram settings saved successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update Telegram settings');
        }
    });
};

export const useTestBot = () => {
    return useMutation({
        mutationFn: async ({ companyId, bot_token }: { companyId: string; bot_token: string }) => {
            const response = await api.post<{ success: boolean; message: string; bot: { username: string; first_name: string } }>(
                `/system/companies/${companyId}/telegram-settings/test-bot`, 
                { bot_token }
            );
            return response.data;
        }
    });
};

export const useTestMessage = () => {
    return useMutation({
        mutationFn: async ({ companyId, bot_token, company_chat_id }: { companyId: string; bot_token: string; company_chat_id: string }) => {
            const response = await api.post<{ success: boolean; message: string }>(
                `/system/companies/${companyId}/telegram-settings/test-message`, 
                { bot_token, company_chat_id }
            );
            return response.data;
        }
    });
};
