import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TelegramEventItem } from '../types';

export const DRIVER_ACTIONS: TelegramEventItem[] = [
    { id: 'admin_announcement', label: 'Announcements', desc: 'Broadcast instant or scheduled company bulletins.' },
    { id: 'admin_assign_task', label: 'Assign Tasks', desc: 'Route alerts for newly dispatched tasks.' },
    { id: 'admin_update_task', label: 'Update Tasks', desc: 'Forward modifications or task completions.' },
    { id: 'admin_assign_delivery', label: 'Assign Deliveries', desc: 'Notify drivers of new customer handoffs.' },
    { id: 'admin_update_delivery', label: 'Update Deliveries', desc: 'Sync status modifications for active deliveries.' },
    { id: 'admin_create_roadblock', label: 'Create Road Blocks', desc: 'Alert drivers to new roadblock mapping pins.' },
    { id: 'admin_publish_route', label: 'Publish Route', desc: 'Push custom dynamic dispatch route sheet details.' },
];

export const ADMIN_ALERTS: TelegramEventItem[] = [
    { id: 'driver_start_shift', label: 'Driver Start Shift', desc: 'Receive alerts when a driver goes online.' },
    { id: 'driver_end_shift', label: 'Driver End Shift', desc: 'Get alerts when driver logs out or vehicle shift finishes.' },
    { id: 'driver_start_task', label: 'Driver Start Task', desc: 'Watch task status transition to active travel.' },
    { id: 'driver_update_task', label: 'Driver Update Task', desc: 'Track driver milestone progress modifications.' },
    { id: 'driver_start_delivery', label: 'Driver Start Delivery', desc: 'Receive delivery pickup alerts.' },
    { id: 'driver_update_delivery', label: 'Driver Update Delivery', desc: 'Follow active drop-off or completed delivery logs.' },
    { id: 'driver_create_roadblock', label: 'Driver Road Block Report', desc: 'Receive alerts for roadblock pins placed on road.' },
    { id: 'driver_log_exception', label: 'Driver Exception Log', desc: 'Alert management when a delivery encounters exceptions.' },
];

interface EventGatekeepingSectionProps {
    allowedEvents: string[];
    onToggleEvent: (eventId: string) => void;
    onSelectAllEvents: () => void;
    onDeselectAllEvents: () => void;
}

export const EventGatekeepingSection: React.FC<EventGatekeepingSectionProps> = ({
    allowedEvents,
    onToggleEvent,
    onSelectAllEvents,
    onDeselectAllEvents,
}) => {
    return (
        <div className="space-y-4 bg-primary/5 p-4 rounded-xl border border-primary/20 h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <Shield size={15} className="text-primary animate-pulse" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                        3. Super Admin Event Gatekeeping
                    </h3>
                </div>
                <div className="flex gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={onSelectAllEvents}
                        className="text-[10px] h-7 px-2 font-bold bg-background hover:bg-muted"
                    >
                        Select All
                    </Button>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={onDeselectAllEvents}
                        className="text-[10px] h-7 px-2 font-bold bg-background text-destructive hover:bg-destructive/5 hover:text-destructive transition-colors"
                    >
                        Deselect All
                    </Button>
                </div>
            </div>
            
            <p className="text-[11px] text-muted-foreground leading-relaxed flex-shrink-0">
                Whitelist which custom Telegram alert rules this organization has permission to configure. Disabled events will be completely hidden from their Company settings dashboard.
            </p>

            <ScrollArea className="flex-1 min-h-0 max-h-[480px]">
                <div className="space-y-4 pb-4">
                    {/* Driver Actions Group */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-foreground border-l-2 border-primary pl-2 mb-2 sticky top-0 bg-background/95 py-1 z-10">
                            Driver Actions (Dispatches)
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {DRIVER_ACTIONS.map(event => {
                                const isChecked = allowedEvents.includes(event.id);
                                return (
                                    <div 
                                        key={event.id}
                                        onClick={() => onToggleEvent(event.id)}
                                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all duration-200 hover:bg-background ${
                                            isChecked 
                                                ? 'bg-background/80 border-primary/30 shadow-sm' 
                                                : 'bg-muted/10 border-muted opacity-60'
                                        }`}
                                    >
                                        <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox 
                                                id={`event-${event.id}`}
                                                checked={isChecked}
                                                onCheckedChange={() => onToggleEvent(event.id)}
                                                className="h-4 w-4"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-foreground leading-none">{event.label}</span>
                                            <span className="text-[9px] text-muted-foreground leading-tight">{event.desc}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Admin Alerts Group */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-foreground border-l-2 border-primary pl-2 mb-2 sticky top-0 bg-background/95 py-1 z-10">
                            Admin Alerts (Driver Logs)
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {ADMIN_ALERTS.map(event => {
                                const isChecked = allowedEvents.includes(event.id);
                                return (
                                    <div 
                                        key={event.id}
                                        onClick={() => onToggleEvent(event.id)}
                                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all duration-200 hover:bg-background ${
                                            isChecked 
                                                ? 'bg-background/80 border-primary/30 shadow-sm' 
                                                : 'bg-muted/10 border-muted opacity-60'
                                        }`}
                                    >
                                        <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox 
                                                id={`event-${event.id}`}
                                                checked={isChecked}
                                                onCheckedChange={() => onToggleEvent(event.id)}
                                                className="h-4 w-4"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-foreground leading-none">{event.label}</span>
                                            <span className="text-[9px] text-muted-foreground leading-tight">{event.desc}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};
