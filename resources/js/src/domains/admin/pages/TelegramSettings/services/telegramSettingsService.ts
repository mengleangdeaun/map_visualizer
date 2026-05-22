import api from '@/lib/api';
import { TelegramRulesResponse, UpdateTelegramRulesPayload } from '../types';

export const telegramSettingsService = {
    async getSettings(): Promise<TelegramRulesResponse> {
        const response = await api.get('/admin/company/telegram-rules');
        return response.data;
    },

    async updateSettings(data: UpdateTelegramRulesPayload): Promise<any> {
        const response = await api.put('/admin/company/telegram-rules', data);
        return response.data;
    },

    async testAction(actionKey: string): Promise<{ message: string }> {
        const response = await api.post('/admin/company/telegram-rules/test-action', {
            action: actionKey
        });
        return response.data;
    }
};
export default telegramSettingsService;
