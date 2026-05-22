import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sliders, Loader2 } from 'lucide-react';

interface GlobalAlertSwitchesProps {
    notifyPwa: boolean;
    setNotifyPwa: (val: boolean) => void;
    notifyDriverTelegram: boolean;
    setNotifyDriverTelegram: (val: boolean) => void;
    notifyCompanyTelegram: boolean;
    setNotifyCompanyTelegram: (val: boolean) => void;
    onSave: () => void;
    isSaving: boolean;
}

export const GlobalAlertSwitches: React.FC<GlobalAlertSwitchesProps> = ({
    notifyPwa,
    setNotifyPwa,
    notifyDriverTelegram,
    setNotifyDriverTelegram,
    notifyCompanyTelegram,
    setNotifyCompanyTelegram,
    onSave,
    isSaving
}) => {
    return (
        <Card className="p-4 ">
            <div className="flex items-center gap-2 pb-3 border-b border-border/80">
                <Sliders className="size-4 text-primary" />
                <h3 className="font-bold text-sm tracking-tight">Global Alert Toggles</h3>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between gap-4 py-3.5 px-0.5 border-b border-border/40">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-foreground">Web PWA Alerts</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                            Deliver browser toasts
                        </span>
                    </div>
                    <Switch 
                        checked={notifyPwa}
                        onCheckedChange={setNotifyPwa}
                    />
                </div>

                <div className="flex items-center justify-between gap-4 py-3.5 px-0.5 border-b border-border/40">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-foreground">Driver Telegram Alert</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                            Direct dispatches to drivers
                        </span>
                    </div>
                    <Switch 
                        checked={notifyDriverTelegram}
                        onCheckedChange={setNotifyDriverTelegram}
                    />
                </div>

                <div className="flex items-center justify-between gap-4 py-3.5 px-0.5 border-b border-border/40">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-foreground">Central Group Broadcast</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                            Broadcast summaries to company
                        </span>
                    </div>
                    <Switch 
                        checked={notifyCompanyTelegram}
                        onCheckedChange={setNotifyCompanyTelegram}
                    />
                </div>
            </div>

            <div className="pt-2">
                <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 tracking-wide transition-all"
                    onClick={onSave}
                    disabled={isSaving}
                >
                    {isSaving && <Loader2 className="size-3.5 mr-2 animate-spin" />}
                    Save Preferences
                </Button>
            </div>
        </Card>
    );
};
export default GlobalAlertSwitches;
