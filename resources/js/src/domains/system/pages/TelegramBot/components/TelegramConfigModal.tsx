import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import SettingSkeleton from './SettingSkeleton';    
import { Company } from '../../../services/companyService';
import { 
    useTelegramSettings, 
    useUpdateTelegramSettings, 
    useTestBot, 
    useTestMessage 
} from '../hooks/useTelegramSettings';

import { ConnectionSettingsSection } from './ConnectionSettingsSection';
import { TriggerSettingsSection } from './TriggerSettingsSection';
import { EventGatekeepingSection, DRIVER_ACTIONS, ADMIN_ALERTS } from './EventGatekeepingSection';


interface TelegramConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company;
}

export const TelegramConfigModal: React.FC<TelegramConfigModalProps> = ({ open, onOpenChange, company }) => {
    const { data: settings, isLoading: isLoadingSettings } = useTelegramSettings(company.id);
    const updateMutation = useUpdateTelegramSettings();
    const testBotMutation = useTestBot();
    const testMessageMutation = useTestMessage();

    // Local form state
    const [botToken, setBotToken] = useState('');
    const [companyChatId, setCompanyChatId] = useState('');
    const [notifyPwa, setNotifyPwa] = useState(true);
    const [notifyDriverTelegram, setNotifyDriverTelegram] = useState(true);
    const [notifyCompanyTelegram, setNotifyCompanyTelegram] = useState(true);
    const [allowedEvents, setAllowedEvents] = useState<string[]>([]);

    // Live validation states
    const [botTestResult, setBotTestResult] = useState<{ success: boolean; message: string; username?: string } | null>(null);
    const [msgTestResult, setMsgTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Load initial settings
    useEffect(() => {
        if (settings) {
            setBotToken(settings.bot_token || '');
            setCompanyChatId(settings.company_chat_id || '');
            setNotifyPwa(settings.notify_pwa);
            setNotifyDriverTelegram(settings.notify_driver_telegram);
            setNotifyCompanyTelegram(settings.notify_company_telegram);
            setAllowedEvents(settings.allowed_events || []);
            setBotTestResult(null);
            setMsgTestResult(null);
        }
    }, [settings]);

    const handleSave = async () => {
        await updateMutation.mutateAsync({
            companyId: company.id,
            data: {
                bot_token: botToken || null,
                company_chat_id: companyChatId || null,
                notify_pwa: notifyPwa,
                notify_driver_telegram: notifyDriverTelegram,
                notify_company_telegram: notifyCompanyTelegram,
                allowed_events: allowedEvents
            }
        });
        onOpenChange(false);
    };

    const handleTestBot = async () => {
        if (!botToken) {
            toast.error('Please enter a Bot Token to test');
            return;
        }
        setBotTestResult(null);
        try {
            const res = await testBotMutation.mutateAsync({ companyId: company.id, bot_token: botToken });
            setBotTestResult({
                success: true,
                message: `Connected! Active Bot: @${res.bot.username} (${res.bot.first_name})`,
                username: res.bot.username
            });
            toast.success('Telegram Bot connected successfully!');
        } catch (err: any) {
            setBotTestResult({
                success: false,
                message: err.response?.data?.message || 'Connection test failed. Invalid token.'
            });
            toast.error('Bot connection failed!');
        }
    };

    const handleTestMessage = async () => {
        if (!botToken || !companyChatId) {
            toast.error('Token and Company Chat ID are required for test messages');
            return;
        }
        setMsgTestResult(null);
        try {
            await testMessageMutation.mutateAsync({ 
                companyId: company.id, 
                bot_token: botToken, 
                company_chat_id: companyChatId 
            });
            setMsgTestResult({
                success: true,
                message: 'Test message delivered successfully!'
            });
            toast.success('Test message sent to Telegram group!');
        } catch (err: any) {
            setMsgTestResult({
                success: false,
                message: err.response?.data?.message || 'Delivery failed. Check group ID and make sure Bot is an admin.'
            });
            toast.error('Failed to deliver test message.');
        }
    };

    const handleToggleEvent = (eventId: string) => {
        setAllowedEvents(prev => 
            prev.includes(eventId) 
                ? prev.filter(id => id !== eventId) 
                : [...prev, eventId]
        );
    };

    const handleSelectAllEvents = () => {
        const allIds = [...DRIVER_ACTIONS, ...ADMIN_ALERTS].map(e => e.id);
        setAllowedEvents(allIds);
    };

    const handleDeselectAllEvents = () => {
        setAllowedEvents([]);
    };

    const isPending = updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] h-[670px] gap-0 p-0 bg-background shadow-2xl grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-border">
                {/* Header */}
                <DialogHeader className="p-5 border-b bg-background flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Send className="size-5 text-primary animate-pulse" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Telegram Bot Setup — {company.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Configure custom notification channels, triggers, and whitelisted events for this organization.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Content body */}
                {isLoadingSettings ? (
                    <SettingSkeleton />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 min-h-0 overflow-hidden">
                        {/* Left Column (Connection & Toggles & Guides) */}
                        <ScrollArea className="h-full max-h-[480px]">
                            <div className="space-y-4 pb-4">
                                <ConnectionSettingsSection 
                                    botToken={botToken}
                                    setBotToken={setBotToken}
                                    companyChatId={companyChatId}
                                    setCompanyChatId={setCompanyChatId}
                                    onTestBot={handleTestBot}
                                    onTestMessage={handleTestMessage}
                                    isTestingBot={testBotMutation.isPending}
                                    isTestingMessage={testMessageMutation.isPending}
                                    botTestResult={botTestResult}
                                    msgTestResult={msgTestResult}
                                />
                                
                                <TriggerSettingsSection 
                                    notifyPwa={notifyPwa}
                                    setNotifyPwa={setNotifyPwa}
                                    notifyDriverTelegram={notifyDriverTelegram}
                                    setNotifyDriverTelegram={setNotifyDriverTelegram}
                                    notifyCompanyTelegram={notifyCompanyTelegram}
                                    setNotifyCompanyTelegram={setNotifyCompanyTelegram}
                                />

                
                            </div>
                        </ScrollArea>

                        {/* Right Column (Gatekeeping Checklist Matrix) */}
                        <div className="min-h-0 h-full">
                            <EventGatekeepingSection 
                                allowedEvents={allowedEvents}
                                onToggleEvent={handleToggleEvent}
                                onSelectAllEvents={handleSelectAllEvents}
                                onDeselectAllEvents={handleDeselectAllEvents}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <DialogFooter className="p-4 border-t bg-muted/10 flex-shrink-0 flex items-center justify-end gap-3 w-full">
                    <Button 
                        size="sm"
                        type="button" 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-semibold h-9"
                    >
                        Cancel
                    </Button>
                    <Button 
                        size="sm"
                        type="button" 
                        className="px-6 bg-primary hover:bg-primary/90 text-xs shadow-md font-bold h-9 transition-all"
                        disabled={isPending || isLoadingSettings}
                        onClick={handleSave}
                    >
                        {isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
