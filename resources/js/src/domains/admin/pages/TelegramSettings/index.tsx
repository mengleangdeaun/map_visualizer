import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { Loader2, Send, Sliders } from 'lucide-react';
import { ConnectionBanner } from './components/ConnectionBanner';
import { GlobalAlertSwitches } from './components/GlobalAlertSwitches';
import { GuideAlert } from './components/GuideAlert';
import { GranularEventAccordion } from './components/GranularEventAccordion';
import { useTelegramSettings } from './hooks/useTelegramSettings';
import { EventConfig } from './types';

const TelegramSettingsPage = () => {
    const { t } = useTranslation(['admin']);
    const [openGroup, setOpenGroup] = useState<'driver' | 'admin' | null>('driver');

    // Custom React Query hook encapsulating API calls
    const { 
        settingsQuery, 
        updateSettingsMutation, 
        sendTestMessageMutation 
    } = useTelegramSettings();

    const { data, isLoading, refetch } = settingsQuery;

    // Local form states
    const [notifyPwa, setNotifyPwa] = useState(true);
    const [notifyDriverTelegram, setNotifyDriverTelegram] = useState(true);
    const [notifyCompanyTelegram, setNotifyCompanyTelegram] = useState(true);
    const [eventSettings, setEventSettings] = useState<Record<string, EventConfig>>({});

    // Synced once query finishes loading
    useEffect(() => {
        if (data) {
            setNotifyPwa(data.settings.notify_pwa);
            setNotifyDriverTelegram(data.settings.notify_driver_telegram);
            setNotifyCompanyTelegram(data.settings.notify_company_telegram);
            setEventSettings(data.event_settings || {});
        }
    }, [data]);

    const handleEventToggle = (key: string, enabled: boolean) => {
        setEventSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                enabled
            }
        }));
    };

    const handleEventInputChange = (key: string, field: 'chat_id' | 'topic_id', value: string) => {
        setEventSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value || null
            }
        }));
    };

    const handleSave = () => {
        updateSettingsMutation.mutate({
            notify_pwa: notifyPwa,
            notify_driver_telegram: notifyDriverTelegram,
            notify_company_telegram: notifyCompanyTelegram,
            event_settings: eventSettings
        });
    };

    if (isLoading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <span className="text-xs font-bold text-muted-foreground">Loading notification preferences...</span>
                </div>
            </div>
        );
    }

    const botConnected = !!data?.settings.bot_token;

    return (
        <div className="space-y-6 max-w-5xl">
            <PageHeader 
                title="Unified Notification Center" 
                subtitle="Manage progressive web push notifications and route operational events to custom Telegram group chats or forum topics."
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isLoading
                }}
            />

            {/* 1. Bot Connection Indicator Banner */}
            <ConnectionBanner 
                botConnected={botConnected}
                botName={data?.settings.bot_name}
                botUsername={data?.settings.bot_username}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* 2. Global Channel Switches (Left Column) */}
                <div className="space-y-6 lg:col-span-1">
                    <GlobalAlertSwitches 
                        notifyPwa={notifyPwa}
                        setNotifyPwa={setNotifyPwa}
                        notifyDriverTelegram={notifyDriverTelegram}
                        setNotifyDriverTelegram={setNotifyDriverTelegram}
                        notifyCompanyTelegram={notifyCompanyTelegram}
                        setNotifyCompanyTelegram={setNotifyCompanyTelegram}
                        onSave={handleSave}
                        isSaving={updateSettingsMutation.isPending}
                    />

                    {/* Guide Card */}
                    <GuideAlert />
                </div>

                {/* 3. Granular Event Routing Accordion (Right Columns) */}
                <div className="space-y-4 lg:col-span-2">
                    
                    {/* ACCORDION SEGMENT A: Driver Actions / Dispatches */}
                    <GranularEventAccordion 
                        type="driver"
                        title="Driver Directed Actions (Admin Dispatches)"
                        subtitle="Route tasks, roadblocks, announcements and publishes from Command Center."
                        icon={<Send className="size-4" />}
                        allowedEvents={data?.allowed_events || []}
                        eventSettings={eventSettings}
                        handleEventToggle={handleEventToggle}
                        handleEventInputChange={handleEventInputChange}
                        botConnected={botConnected}
                        sendTestMessageMutation={sendTestMessageMutation}
                        isOpen={openGroup === 'driver'}
                        onToggle={() => setOpenGroup(openGroup === 'driver' ? null : 'driver')}
                        defaultCompanyChatId={data?.settings.company_chat_id}
                    />

                    {/* ACCORDION SEGMENT B: Admin Alerts / Driver Status Logs */}
                    <GranularEventAccordion 
                        type="admin"
                        title="Admin Alerts (Driver Status & Reporting Logs)"
                        subtitle="Forward shift events, progress updates, roadblock hazards, and exception logs."
                        icon={<Sliders className="size-4" />}
                        allowedEvents={data?.allowed_events || []}
                        eventSettings={eventSettings}
                        handleEventToggle={handleEventToggle}
                        handleEventInputChange={handleEventInputChange}
                        botConnected={botConnected}
                        sendTestMessageMutation={sendTestMessageMutation}
                        isOpen={openGroup === 'admin'}
                        onToggle={() => setOpenGroup(openGroup === 'admin' ? null : 'admin')}
                        defaultCompanyChatId={data?.settings.company_chat_id}
                    />
                </div>
            </div>
        </div>
    );
};

export default TelegramSettingsPage;
