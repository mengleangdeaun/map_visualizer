import React from 'react';
import { 
    MapPin, 
    ChevronRight, 
    Navigation, 
    Clock, 
    DollarSign 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { StopCardProps } from '../types';

export const StopCard: React.FC<StopCardProps> = React.memo(({
    stop,
    currentTime,
    isArrivePending,
    updatingStopId,
    onArrive,
    t
}) => {
    const navigate = useNavigate();
    const dl = stop.delivery;
    if (!dl) return null;

    const isArrived = stop.status === 'arrived';
    const isCompleted = stop.status === 'completed';
    const isSkipped = stop.status === 'skipped';
    const order = dl.order;

    const getStatusLabelAndColor = (stopStatus: string, deliveryStatus: string) => {
        if (stopStatus === 'completed') {
            return {
                label: t('delivered') || 'Delivered',
                className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            };
        }
        if (stopStatus === 'skipped') {
            if (deliveryStatus === 'rescheduled') {
                return {
                    label: t('rescheduled') || 'Rescheduled',
                    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                };
            }
            return {
                label: t('failed') || 'Failed',
                className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            };
        }
        if (stopStatus === 'in_transit') {
            return {
                label: t('in_transit') || 'In Transit',
                className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 animate-pulse'
            };
        }
        if (stopStatus === 'arrived') {
            return {
                label: t('arrived') || 'Arrived',
                className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse'
            };
        }
        return {
            label: t('pending') || 'Pending',
            className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
        };
    };

    const formatDuration = (startedAt: string | null, completedAt: string | null) => {
        if (!startedAt) return '';
        const start = new Date(startedAt).getTime();
        const end = completedAt ? new Date(completedAt).getTime() : currentTime;
        const diffMs = end - start;
        if (diffMs < 0) return '0s';
        
        const diffSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    return (
        <div 
            onClick={() => navigate({ to: `/driver/route/stop/${stop.id}` })}
            className={cn(
                "p-4 shadow shadow-black/5 border-none bg-white dark:bg-card hover:bg-gray-50/50 transition-all duration-300 active:scale-[0.99] cursor-pointer rounded-2xl flex flex-col gap-3 select-none",
                isCompleted && "opacity-70"
            )}
        >
            {/* Header: Sequence, Tracking, Badge */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {/* Circle sequence indicator */}
                    <div className={cn(
                        "size-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 select-none shadow-sm transition-all duration-300",
                        isCompleted ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700" :
                        stop.status === 'in_transit' ? "bg-sky-500 text-white animate-pulse shadow-lg shadow-sky-500/20 border border-sky-400" :
                        isArrived ? "bg-amber-500 text-white animate-pulse shadow-lg shadow-amber-500/20 border border-amber-400" :
                        "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border border-primary/20"
                    )}>
                        {stop.sequence_number}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                            #{dl.tracking_number}
                        </span>
                        <h3 className="font-extrabold text-gray-800 dark:text-foreground text-sm tracking-tight truncate max-w-[170px] mt-0.5">
                            {order?.customer?.name || 'Walk-in Customer'}
                        </h3>
                    </div>
                </div>

                <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full select-none",
                    getStatusLabelAndColor(stop.status, dl.status).className
                )}>
                    {getStatusLabelAndColor(stop.status, dl.status).label}
                </span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 bg-gray-50/70 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100/50 dark:border-gray-800/40 text-xs">
                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                <span className="text-gray-600 dark:text-gray-300 leading-relaxed break-words line-clamp-2">
                    {dl.dropoff_address}
                </span>
            </div>

            {/* Bottom Row: COD details, Dynamic Timer & Action Button */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/60">
                <div className="flex flex-col">
                    {order && (
                        <>
                            <div className="flex items-center gap-0.5 text-xs font-black text-emerald-600 dark:text-emerald-500 font-sans">
                                <DollarSign size={14} strokeWidth={2.5} />
                                <span>{(parseFloat(order.amount_due_cod.toString()) || 0).toFixed(2)} COD</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                     {order.payment_status || 'unpaid'} • {order.payment_method || 'COD'}
                                </span>
                                {dl.started_at && (isCompleted || isSkipped) && dl.completed_at && (
                                    <>
                                        <span className="text-[8px] text-gray-300 dark:text-gray-700">•</span>
                                        <div className="flex items-center gap-0.5 text-[8px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded shrink-0">
                                            <Clock size={8} />
                                            <span>{formatDuration(dl.started_at, dl.completed_at)}</span>
                                        </div>
                                    </>
                                )}
                                {stop.status === 'in_transit' && dl.started_at && (
                                    <>
                                        <span className="text-[8px] text-gray-300 dark:text-gray-700">•</span>
                                        <div className="flex items-center gap-0.5 text-[8px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/20 px-1.5 py-0.5 rounded shrink-0 animate-pulse border border-sky-100 dark:border-sky-900/30">
                                            <Clock size={8} />
                                            <span>{formatDuration(dl.started_at, null)}</span>
                                        </div>
                                    </>
                                )}
                                {stop.status === 'arrived' && dl.started_at && (
                                    <>
                                        <span className="text-[8px] text-gray-300 dark:text-gray-700">•</span>
                                        <div className="flex items-center gap-0.5 text-[8px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded shrink-0 animate-pulse border border-blue-100 dark:border-blue-900/30">
                                            <Clock size={8} />
                                            <span>{formatDuration(dl.started_at, null)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Stop Action or View details link */}
                {stop.status === 'pending' || stop.status === 'in_transit' ? (
                    <Button
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Avoid card click navigation trigger
                            onArrive(stop.id);
                        }}
                        className={cn(
                            "h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-1.5 shadow-md transition-all duration-300 active:scale-95",
                            stop.status === 'in_transit' 
                                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/10" 
                                : "bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/10"
                        )}
                        disabled={isArrivePending}
                    >
                        <Navigation size={10} className={cn(stop.status === 'in_transit' && "rotate-45")} strokeWidth={2.5} />
                        {stop.status === 'in_transit' ? "Arrived?" : "Arrive"}
                    </Button>
                ) : (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                        <span>{t('view_details') || 'Details'}</span>
                        <ChevronRight size={12} className="text-gray-400" />
                    </div>
                )}
            </div>
        </div>
    );
});

StopCard.displayName = 'StopCard';
