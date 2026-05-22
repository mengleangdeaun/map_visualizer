import React from 'react';
import { HelpCircle } from 'lucide-react';

export const IntegrationGuideSection: React.FC = () => {
    return (
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2 flex gap-3">
            <HelpCircle className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
                <h4 className="text-xs font-bold text-primary">Need Help? Quick Telegram Bot Guide:</h4>
                <ul className="list-disc pl-4 text-[10px] text-muted-foreground space-y-1 leading-normal">
                    <li>Search for <b>@BotFather</b> on Telegram and send <code>/newbot</code> to get your <b>Bot Token</b>.</li>
                    <li>Invite your new Bot as an <b>Administrator</b> into your company Telegram group chat or channel.</li>
                    <li>Send any message in the group, then check <code>https://api.telegram.org/bot&lt;token&gt;/getUpdates</code> to find the group's <b>Chat ID</b> (it will start with <code>-100</code>).</li>
                    <li>For forum-style supergroups, drivers can specify their topic thread ID inside their User Profile!</li>
                </ul>
            </div>
        </div>
    );
};
