import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

interface ConnectionBannerProps {
    botConnected: boolean;
    botUsername?: string | null;
    botName?: string | null;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
    botConnected,
    botUsername,
    botName
}) => {
    return (
        <Card className={`p-5 flex items-start gap-4 ring-0 ${botConnected ? 'bg-emerald-500/5 border-l-4 border-emerald-500' : 'bg-rose-500/5 border-l-4 border-rose-500'}`}>
            <div className={`p-3 rounded-none shrink-0 ${botConnected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                <Bot className="size-6 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">
                        {botConnected ? 'Connected with Organization Bot' : 'No Active Bot Token Registered'}
                    </span>
                    <Badge variant="outline" className={botConnected ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold rounded-none' : 'bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold rounded-none'}>
                        {botConnected ? 'Connected' : 'Action Required'}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                    {botConnected 
                        ? `Active Telegram Bot: @${botUsername || 'unnamed'} (${botName || 'Organization Bot'}). Dynamic routing and topic-thread notifications are fully active.`
                        : 'Please ask a Platform Administrator / Super Admin to register a custom Telegram Bot Token for your company. Once configured, you can route operations events here.'
                    }
                </p>
            </div>
        </Card>
    );
};
export default ConnectionBanner;
