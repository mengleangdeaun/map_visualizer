import api from '@/lib/api';
import { 
    TelegramSettings, 
    UpdateTelegramSettingsPayload, 
    TestBotResponse, 
    TestMessageResponse 
} from '../types';

export const telegramBotService = {
    getSettings: async (companyId: string): Promise<TelegramSettings> => {
        const response = await api.get<TelegramSettings>(`/system/companies/${companyId}/telegram-settings`);
        return response.data;
    },

    updateSettings: async (
        companyId: string, 
        data: UpdateTelegramSettingsPayload
    ): Promise<{ message: string; data: TelegramSettings }> => {
        const response = await api.put<{ message: string; data: TelegramSettings }>(
            `/system/companies/${companyId}/telegram-settings`, 
            data
        );
        return response.data;
    },

    testBot: async (
        companyId: string, 
        botToken: string
    ): Promise<TestBotResponse> => {
        const response = await api.post<TestBotResponse>(
            `/system/companies/${companyId}/telegram-settings/test-bot`, 
            { bot_token: botToken }
        );
        return response.data;
    },

    testMessage: async (
        companyId: string, 
        botToken: string, 
        companyChatId: string
    ): Promise<TestMessageResponse> => {
        const response = await api.post<TestMessageResponse>(
            `/system/companies/${companyId}/telegram-settings/test-message`, 
            { bot_token: botToken, company_chat_id: companyChatId }
        );
        return response.data;
    },
};
