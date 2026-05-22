import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface TriggerSettingsSectionProps {
    notifyPwa: boolean;
    setNotifyPwa: (value: boolean) => void;
    notifyDriverTelegram: boolean;
    setNotifyDriverTelegram: (value: boolean) => void;
    notifyCompanyTelegram: boolean;
    setNotifyCompanyTelegram: (value: boolean) => void;
}

export const TriggerSettingsSection: React.FC<TriggerSettingsSectionProps> = ({
    notifyPwa,
    setNotifyPwa,
    notifyDriverTelegram,
    setNotifyDriverTelegram,
    notifyCompanyTelegram,
    setNotifyCompanyTelegram,
}) => {
    return (
        <div className="space-y-4 bg-accent/5 p-4 rounded-xl border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertCircle size={14} className="text-primary" />
                2. Multi-Channel Triggers (Toggle On/Off)
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
                Enable or disable real-time delivery alerts across our separate tracking domains when new tasks are dispatched.
            </p>

            <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-4 p-2.5 bg-background rounded-lg border hover:border-primary/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-foreground">Driver PWA App Alerts</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                            Driver receives instant pop-up toast alerts inside their progressive web application.
                        </span>
                    </div>
                    <Switch 
                        checked={notifyPwa}
                        onCheckedChange={setNotifyPwa}
                    />
                </div>

                <div className="flex items-center justify-between gap-4 p-2.5 bg-background rounded-lg border hover:border-primary/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-foreground">Driver Telegram Alert Routing</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                            Bot forwards targeted dispatch alerts to the Driver's custom group chat or targeted topic thread.
                        </span>
                    </div>
                    <Switch 
                        checked={notifyDriverTelegram}
                        onCheckedChange={setNotifyDriverTelegram}
                    />
                </div>

                <div className="flex items-center justify-between gap-4 p-2.5 bg-background rounded-lg border hover:border-primary/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-foreground">Central Company Group Alerts</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                            Bot broadcasts a beautifully formatted markdown dispatch summary to the organization's central chat room.
                        </span>
                    </div>
                    <Switch 
                        checked={notifyCompanyTelegram}
                        onCheckedChange={setNotifyCompanyTelegram}
                    />
                </div>
            </div>
        </div>
    );
};
