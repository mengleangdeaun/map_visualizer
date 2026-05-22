export interface TelegramSettings {
    id: string;
    company_id: string;
    bot_token: string | null;
    company_chat_id: string | null;
    notify_pwa: boolean;
    notify_driver_telegram: boolean;
    notify_company_telegram: boolean;
    allowed_events?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface UpdateTelegramSettingsPayload {
    bot_token: string | null;
    company_chat_id: string | null;
    notify_pwa: boolean;
    notify_driver_telegram: boolean;
    notify_company_telegram: boolean;
    allowed_events: string[];
}

export interface TestBotPayload {
    bot_token: string;
}

export interface TestBotResponse {
    success: boolean;
    message: string;
    bot: {
        username: string;
        first_name: string;
    };
}

export interface TestMessagePayload {
    bot_token: string;
    company_chat_id: string;
}

export interface TestMessageResponse {
    success: boolean;
    message: string;
}

export interface TelegramEventItem {
    id: string;
    label: string;
    desc: string;
}
