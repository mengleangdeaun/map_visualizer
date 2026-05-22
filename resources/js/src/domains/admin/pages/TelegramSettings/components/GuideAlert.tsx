import React from 'react';
import { Card } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export const GuideAlert: React.FC = () => {
    return (
        <Card className="p-4 bg-primary/5 text-primary space-y-0 flex items-start gap-3">
            <HelpCircle className="size-5 shrink-0 text-primary mt-0.5" />
            <div className="space-y-1">
                <span className="text-xs font-bold leading-none">Dynamic Routing Scope:</span>
                <p className="text-[10px] text-muted-foreground leading-normal">
                    Leaving Chat ID empty inside event preferences defaults alerts to your organization's <b>Default Company Chat ID</b>. 
                    <br /><br />
                    For forum-style groups, specify the targeted <b>Topic Thread ID</b> (found in telegram URL query strings) to send notifications directly to specific threads!
                </p>
            </div>
        </Card>
    );
};
export default GuideAlert;
