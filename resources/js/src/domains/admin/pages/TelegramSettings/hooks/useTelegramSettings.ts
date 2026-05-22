import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramSettingsService } from '../services/telegramSettingsService';
import { UpdateTelegramRulesPayload } from '../types';
import { toast } from 'sonner';

export const useTelegramSettings = () => {
    const queryClient = useQueryClient();

    const settingsQuery = useQuery({
        queryKey: ['company-telegram-rules'],
        queryFn: () => telegramSettingsService.getSettings()
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (payload: UpdateTelegramRulesPayload) => 
            telegramSettingsService.updateSettings(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-telegram-rules'] });
            toast.success('Notification settings saved successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to save settings.');
        }
    });

    const sendTestMessageMutation = useMutation({
        mutationFn: (actionKey: string) => 
            telegramSettingsService.testAction(actionKey),
        onSuccess: (res) => {
            toast.success(res.message || 'Test notification delivered successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to deliver test message.');
        }
    });

    return {
        settingsQuery,
        updateSettingsMutation,
        sendTestMessageMutation
    };
};
export default useTelegramSettings;
