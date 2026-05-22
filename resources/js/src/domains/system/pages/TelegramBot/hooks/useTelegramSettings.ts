import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { telegramBotService } from '../services/telegramBotService';
import { TelegramSettings, UpdateTelegramSettingsPayload } from '../types';

export type { TelegramSettings } from '../types';

export const useTelegramSettings = (companyId: string | null) => {
    return useQuery({
        queryKey: ['company-telegram-settings', companyId],
        queryFn: async () => {
            if (!companyId) return null;
            return telegramBotService.getSettings(companyId);
        },
        enabled: !!companyId,
    });
};

export const useUpdateTelegramSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ companyId, data }: { companyId: string; data: UpdateTelegramSettingsPayload }) => {
            return telegramBotService.updateSettings(companyId, data);
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
            return telegramBotService.testBot(companyId, bot_token);
        }
    });
};

export const useTestMessage = () => {
    return useMutation({
        mutationFn: async ({ companyId, bot_token, company_chat_id }: { companyId: string; bot_token: string; company_chat_id: string }) => {
            return telegramBotService.testMessage(companyId, bot_token, company_chat_id);
        }
    });
};
