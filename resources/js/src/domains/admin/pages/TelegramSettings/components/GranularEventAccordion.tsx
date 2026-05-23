import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
    Bell, Send, ClipboardList, Package, AlertTriangle, Flag, 
    UserCheck, AlertCircle, ChevronUp, ChevronDown, Loader2 
} from 'lucide-react';
import { EventConfig } from '../types';
import { EmptyState } from '@/components/shared/system/EmptyState';

export const eventMetaData: Record<string, { label: string; desc: string; icon: React.ReactNode; group: 'driver' | 'admin' }> = {
    // Driver Directed Actions (Admin Dispatches)
    admin_announcement: { 
        label: 'Admin Announcement', 
        desc: 'Notify drivers when admin publishes/schedules a fleet-wide announcement', 
        icon: <Bell className="size-4 text-sky-500" />,
        group: 'driver' 
    },
    admin_assign_task: { 
        label: 'Admin Assign Tasks', 
        desc: 'Notify drivers when a new operational task is assigned to them', 
        icon: <ClipboardList className="size-4 text-emerald-500" />,
        group: 'driver' 
    },
    admin_update_task: { 
        label: 'Admin Update Tasks', 
        desc: 'Notify drivers when an active task description or address is updated by dispatchers', 
        icon: <ClipboardList className="size-4 text-indigo-500" />,
        group: 'driver' 
    },
    admin_assign_delivery: { 
        label: 'Admin Assign Deliveries', 
        desc: 'Notify drivers when new parcel deliveries are assigned to their routes', 
        icon: <Package className="size-4 text-blue-500" />,
        group: 'driver' 
    },
    admin_update_delivery: { 
        label: 'Admin Update Deliveries', 
        desc: 'Notify drivers when parcel delivery targets or client profiles are modified', 
        icon: <Package className="size-4 text-teal-500" />,
        group: 'driver' 
    },
    admin_create_roadblock: { 
        label: 'Admin Create Road Block', 
        desc: 'Forward roadblock / temporary hazard warnings to driver alert chats', 
        icon: <AlertTriangle className="size-4 text-red-500" />,
        group: 'driver' 
    },
    admin_publish_route: { 
        label: 'Admin Publish Route', 
        desc: 'Notify drivers when an entire structured route is finalized and published', 
        icon: <Flag className="size-4 text-violet-500" />,
        group: 'driver' 
    },

    // Admin Alerts (Driver Status & Reporting Logs)
    driver_start_shift: { 
        label: 'Driver Start Shift', 
        desc: 'Notify control center when a driver starts their operational work shift', 
        icon: <UserCheck className="size-4 text-emerald-500" />,
        group: 'admin' 
    },
    driver_end_shift: { 
        label: 'Driver End Shift', 
        desc: 'Notify control center when a driver closes their shift and logs out', 
        icon: <UserCheck className="size-4 text-slate-500" />,
        group: 'admin' 
    },
    driver_start_task: { 
        label: 'Driver Start Tasks', 
        desc: 'Log alerts when a driver begins transit to a custom task location', 
        icon: <ClipboardList className="size-4 text-amber-500" />,
        group: 'admin' 
    },
    driver_update_task: { 
        label: 'Driver Update Tasks', 
        desc: 'Log alerts when a driver arrives, completes, or reports progress on a task', 
        icon: <ClipboardList className="size-4 text-indigo-500" />,
        group: 'admin' 
    },
    driver_start_delivery: { 
        label: 'Driver Start Deliveries', 
        desc: 'Log alerts when a driver commences delivery navigation towards a client stop', 
        icon: <Package className="size-4 text-amber-500" />,
        group: 'admin' 
    },
    driver_update_delivery: { 
        label: 'Driver Update Deliveries', 
        desc: 'Log alerts when a driver registers arrival, success, or skips a delivery stop', 
        icon: <Package className="size-4 text-sky-500" />,
        group: 'admin' 
    },
    driver_create_roadblock: { 
        label: 'Driver Create Road Block', 
        desc: 'Log alerts when a driver reports a new hazard or roadblock warning directly from the field', 
        icon: <AlertTriangle className="size-4 text-amber-600 animate-pulse" />,
        group: 'admin' 
    },
    driver_log_exception: { 
        label: 'Driver Log Exception', 
        desc: 'Log alerts when a driver encounters a delivery issue, refusal, or custom exception', 
        icon: <AlertCircle className="size-4 text-rose-500" />,
        group: 'admin' 
    },
};

interface GranularEventAccordionProps {
    type: 'driver' | 'admin';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    allowedEvents: string[];
    eventSettings: Record<string, EventConfig>;
    handleEventToggle: (key: string, enabled: boolean) => void;
    handleEventInputChange: (key: string, field: 'chat_id' | 'topic_id', value: string) => void;
    botConnected: boolean;
    sendTestMessageMutation: {
        mutate: (actionKey: string) => void;
        isPending: boolean;
        variables: string | undefined;
    };
    isOpen: boolean;
    onToggle: () => void;
    defaultCompanyChatId?: string | null;
}

export const GranularEventAccordion: React.FC<GranularEventAccordionProps> = ({
    type,
    title,
    subtitle,
    icon,
    allowedEvents,
    eventSettings,
    handleEventToggle,
    handleEventInputChange,
    botConnected,
    sendTestMessageMutation,
    isOpen,
    onToggle,
    defaultCompanyChatId
}) => {
    const filteredKeys = allowedEvents.filter(key => eventMetaData[key]?.group === type);

    return (
        <Card className="overflow-hidden p-4 ">
            <button 
                type="button"
                onClick={onToggle}
                className="w-full py-4 flex items-center justify-between bg-transparent border-b border-border transition-all text-left"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${type === 'driver' ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'}`}>
                        {icon}
                    </div>
                    <div>
                        <span className="font-bold text-sm block tracking-tight">{title}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{subtitle}</span>
                    </div>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="divide-y divide-border/60 bg-transparent">
                    {filteredKeys.map(key => {
                        const meta = eventMetaData[key];
                        const config = eventSettings[key] || { enabled: true, chat_id: null, topic_id: null };
                        
                        return (
                            <div key={key} className="py-5 space-y-4 transition-all border-b border-border/40 last:border-b-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-2.5 items-start">
                                        <div className="p-2 bg-muted rounded-md shrink-0 mt-0.5">
                                            {meta?.icon || <Bell className="size-4" />}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-foreground">{meta?.label || key}</span>
                                            <span className="text-[10px] text-muted-foreground leading-normal">{meta?.desc}</span>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={config.enabled}
                                        onCheckedChange={(checked) => handleEventToggle(key, checked)}
                                    />
                                </div>

                                {config.enabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 md:pl-10 animate-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom Chat ID Override</Label>
                                            <Input 
                                                value={config.chat_id || ''}
                                                onChange={(e) => handleEventInputChange(key, 'chat_id', e.target.value)}
                                                placeholder={defaultCompanyChatId || 'e.g. -1002391039'}
                                                className="h-8 text-xs font-mono "
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Topic Thread ID (message_thread_id)</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={config.topic_id || ''}
                                                    onChange={(e) => handleEventInputChange(key, 'topic_id', e.target.value)}
                                                    placeholder="e.g. 42"
                                                    className="h-8 text-xs font-mono flex-1 "
                                                />
                                                <Button 
                                                    size="icon-sm"
                                                    variant="outline"
                                                    disabled={!botConnected || sendTestMessageMutation.isPending}
                                                    onClick={() => sendTestMessageMutation.mutate(key)}
                                                    className="h-8 w-8 border-input/60 hover:bg-muted"
                                                    title="Send Live Test Message"
                                                >
                                                    {sendTestMessageMutation.isPending && sendTestMessageMutation.variables === key ? (
                                                        <Loader2 className="size-3 animate-spin text-primary" />
                                                    ) : (
                                                        <Send className="size-3 text-primary" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredKeys.length === 0 && (
                        <div className=" text-center text-xs text-muted-foreground">
                            <EmptyState 
                                type="no-data"
                                description='No notifications whitelisted by platform administration in this group.'
                            />
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
export default GranularEventAccordion;
