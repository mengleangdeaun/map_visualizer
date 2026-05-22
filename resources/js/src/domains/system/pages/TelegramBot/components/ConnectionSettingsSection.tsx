import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ConnectionSettingsSectionProps {
    botToken: string;
    setBotToken: (value: string) => void;
    companyChatId: string;
    setCompanyChatId: (value: string) => void;
    onTestBot: () => void;
    onTestMessage: () => void;
    isTestingBot: boolean;
    isTestingMessage: boolean;
    botTestResult: { success: boolean; message: string; username?: string } | null;
    msgTestResult: { success: boolean; message: string } | null;
}

export const ConnectionSettingsSection: React.FC<ConnectionSettingsSectionProps> = ({
    botToken,
    setBotToken,
    companyChatId,
    setCompanyChatId,
    onTestBot,
    onTestMessage,
    isTestingBot,
    isTestingMessage,
    botTestResult,
    msgTestResult,
}) => {
    return (
        <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-dashed">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Bot Connection & Channel Mapping
            </h3>
            
            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label htmlFor="botToken" className="text-xs font-medium">Telegram Bot Token (HTTP API)</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="botToken"
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                            className="font-mono text-xs bg-background flex-1 h-9"
                        />
                        <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            disabled={isTestingBot || !botToken}
                            onClick={onTestBot}
                            className="font-bold h-9 flex-shrink-0 bg-background hover:bg-muted text-xs transition-colors"
                        >
                            {isTestingBot && <Loader2 className="size-3 mr-1 animate-spin" />}
                            Test Bot
                        </Button>
                    </div>
                    {botTestResult && (
                        <div className={`text-[10px] font-medium flex items-center gap-1.5 mt-1 ${botTestResult.success ? 'text-emerald-600' : 'text-destructive'}`}>
                            {botTestResult.success ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} />}
                            {botTestResult.message}
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="companyChat" className="text-xs font-medium">Company Telegram Group Chat ID</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="companyChat"
                            value={companyChatId}
                            onChange={(e) => setCompanyChatId(e.target.value)}
                            placeholder="e.g. -1002384910239"
                            className="font-mono text-xs bg-background flex-1 h-9"
                        />
                        <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            disabled={isTestingMessage || !botToken || !companyChatId}
                            onClick={onTestMessage}
                            className="font-bold h-9 flex-shrink-0 bg-background hover:bg-muted text-xs transition-colors"
                        >
                            {isTestingMessage && <Loader2 className="size-3 mr-1 animate-spin" />}
                            Send Test Alert
                        </Button>
                    </div>
                    {msgTestResult && (
                        <div className={`text-[10px] font-medium flex items-center gap-1.5 mt-1 ${msgTestResult.success ? 'text-emerald-600' : 'text-destructive'}`}>
                            {msgTestResult.success ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} />}
                            {msgTestResult.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
