import React from 'react';
import { MapPin, Phone, Navigation, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ActiveTask } from '../types';

interface TaskCardProps {
    task: ActiveTask;
    t: (key: string) => string;
    onStatusChange: (taskId: string, currentStatus: string) => void;
    isUpdating: boolean;
    updatingTaskId?: string;
}

const getPriorityStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'urgent':
            return 'bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse';
        case 'high':
            return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
        case 'normal':
            return 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
        case 'low':
            return 'bg-sky-500/10 text-sky-600 border border-sky-500/20';
        default:
            return 'bg-gray-500/10 text-gray-600 border border-gray-500/20';
    }
};

const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'in_progress':
            return 'bg-amber-500/15 text-amber-600 border border-amber-500/20';
        case 'assigned':
            return 'bg-blue-500/15 text-blue-600 border border-blue-500/20 animate-pulse';
        default:
            return 'bg-gray-500/15 text-gray-600 border border-gray-500/20';
    }
};

export const TaskCard = React.memo(({
    task,
    t,
    onStatusChange,
    isUpdating,
    updatingTaskId
}: TaskCardProps) => {
    const isThisTaskUpdating = isUpdating && updatingTaskId === task.id;

    const formattedTime = task.scheduled_at || task.created_at
        ? new Date(task.scheduled_at || task.created_at).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
        : '--:--';

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (task.contact_phone) {
            window.location.href = `tel:${task.contact_phone}`;
        }
    };

    return (
        <div className="p-4 bg-white rounded-2xl shadow-sm shadow-black/5 transition-all duration-300 flex flex-col gap-3.5 border-none">
            {/* Header: Status and Time */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                        getStatusStyles(task.status)
                    )}>
                        {t(`driver:status_${task.status}`) || task.status}
                    </span>

                    {task.priority && (
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            getPriorityStyles(task.priority)
                        )}>
                            {t(`driver:priority_${task.priority}`) || task.priority}
                        </span>
                    )}
                </div>

                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <Clock size={11} strokeWidth={2} />
                    {formattedTime}
                </span>
            </div>

            {/* Task Info */}
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
                    ID: {task.id.substring(0, 8).toUpperCase()}
                </span>
                <h3 className="text-base font-black text-gray-800 leading-tight">
                    {task.title || 'Untitled Delivery Task'}
                </h3>
                {task.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}
            </div>

            {/* Address Details (Route Style) */}
            <div className="flex flex-col gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100/60 text-xs">
                {/* Pickup Address */}
                <div className="flex items-start gap-2.5">
                    <div className="size-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <MapPin size={13} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                            {t('driver:pickup') || 'Pickup'}
                        </span>
                        {task.pickup_lat && task.pickup_lng ? (
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${task.pickup_lat},${task.pickup_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-gray-700 hover:text-primary hover:underline transition-colors mt-0.5 leading-snug truncate flex items-center gap-1 group"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {task.pickup_address || 'Google Maps Location'}
                                <span className="inline-block opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary">↗</span>
                            </a>
                        ) : (
                            <span className="font-semibold text-gray-700 mt-0.5 leading-snug truncate">
                                {task.pickup_address || 'No Pickup Address'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Divider connector */}
                <div className="h-[1px] w-full bg-gray-200/60" />

                {/* Dropoff Address */}
                <div className="flex items-start gap-2.5">
                    <div className="size-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                        <Navigation size={13} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                            {t('driver:dropoff') || 'Drop-off'}
                        </span>
                        {task.dropoff_lat && task.dropoff_lng ? (
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${task.dropoff_lat},${task.dropoff_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-gray-700 hover:text-primary hover:underline transition-colors mt-0.5 leading-snug truncate flex items-center gap-1 group"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {task.dropoff_address || 'Google Maps Location'}
                                <span className="inline-block opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary">↗</span>
                            </a>
                        ) : (
                            <span className="font-semibold text-gray-700 mt-0.5 leading-snug truncate">
                                {task.dropoff_address || 'No Dropoff Address'}
                            </span>
                        )}

                        {(task.contact_name || task.contact_phone) && (
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-gray-500">
                                <span>{task.contact_name || 'No Name'}</span>
                                {task.contact_phone && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span>{task.contact_phone}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions: Call & Start/Complete buttons */}
            <div className="flex gap-2.5 pt-1.5">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-10 font-bold uppercase text-[10px] tracking-widest gap-2 rounded-xl text-gray-600 hover:text-gray-800 transition-all"
                    onClick={handleCall}
                    disabled={!task.contact_phone}
                >
                    <Phone size={13} strokeWidth={2.5} />
                    {t('driver:call') || 'Call'}
                </Button>
                
                <Button 
                    size="sm" 
                    className={cn(
                        "flex-1 h-10 font-bold uppercase text-[10px] tracking-widest gap-2 rounded-xl shadow-md transition-all duration-300",
                        task.status === 'assigned' 
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10" 
                            : "bg-green-600 hover:bg-green-700 text-white shadow-green-500/10"
                    )}
                    onClick={() => onStatusChange(task.id, task.status)}
                    disabled={isUpdating}
                >
                    {isThisTaskUpdating ? (
                        <Clock className="size-3.5 animate-spin" />
                    ) : (task.status === 'assigned' || task.status === 'pending') ? (
                        <>
                            <Navigation size={13} className="rotate-45" strokeWidth={2.5} />
                            {t('driver:start_task') || 'Start'}
                        </>
                    ) : (
                        <>
                            <CheckCircle size={13} strokeWidth={2.5} />
                            {t('driver:complete') || 'Complete'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
});

TaskCard.displayName = 'TaskCard';
