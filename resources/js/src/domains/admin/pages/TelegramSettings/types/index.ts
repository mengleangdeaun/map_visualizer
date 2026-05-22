export interface EventConfig {
    enabled: boolean;
    chat_id: string | null;
    topic_id: string | null;
}

export interface TelegramSettings {
    id: string;
    company_id: string;
    bot_token: string | null;
    company_chat_id: string | null;
    bot_name: string | null;
    bot_username: string | null;
    notify_pwa: boolean;
    notify_driver_telegram: boolean;
    notify_company_telegram: boolean;
}

export interface TelegramRulesResponse {
    settings: TelegramSettings;
    allowed_events: string[];
    event_settings: Record<string, EventConfig>;
}

export interface UpdateTelegramRulesPayload {
    notify_pwa: boolean;
    notify_driver_telegram: boolean;
    notify_company_telegram: boolean;
    event_settings: Record<string, EventConfig>;
}
