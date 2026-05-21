import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration, getStatusLabel } from '../hooks/useStopDetails';
import type { RouteStop } from '../types';

interface StopTimelineCardProps {
    stop: RouteStop;
    currentTime: number;
}

export const StopTimelineCard: React.FC<StopTimelineCardProps> = ({ stop, currentTime }) => {
    const dl = stop.delivery;
    const isCompleted = stop.status === 'completed';
    const isSkipped = stop.status === 'skipped';

    if (!dl.started_at && !dl.scheduled_at) return null;

    return (
        <Card className="p-4 border-none shadow-md bg-card space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <Clock size={18} className="text-primary" />
                <h3 className="font-bold text-base text-foreground">Stop Timeline & Duration</h3>
            </div>

            <div className="relative pl-6 border-l-2 border-primary/20 space-y-4 text-sm">
                {/* Scheduled */}
                {dl.scheduled_at && (
                    <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-muted-foreground border-4 border-background" />
                        <p className="font-bold text-xs text-foreground">Scheduled Time</p>
                        <p className="text-[10px] text-muted-foreground">
                            {new Date(dl.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                )}

                {/* Started Route */}
                {dl.started_at && (
                    <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-sky-400 border-4 border-background" />
                        <p className="font-bold text-xs text-foreground">Started Route</p>
                        <p className="text-[10px] text-muted-foreground">
                            {new Date(dl.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                )}

                {/* In Transit live timer */}
                {stop.status === 'in_transit' && dl.started_at && (
                    <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-sky-500 border-4 border-background animate-ping" />
                        <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-sky-500 border-4 border-background" />
                        <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            In Transit
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        </p>
                        <p className="text-xs font-black text-sky-500 mt-1">
                            Driving: {formatDuration(dl.started_at, null, currentTime)}
                        </p>
                    </div>
                )}

                {/* Arrived at Stop */}
                {stop.arrived_at && (
                    <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-4 border-background" />
                        <p className="font-bold text-xs text-foreground">Arrived at Stop</p>
                        <p className="text-[10px] text-muted-foreground">
                            {new Date(stop.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                )}

                {/* At Customer — live timer ticks from arrived_at (FIXED) */}
                {stop.status === 'arrived' && stop.arrived_at && (
                    <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-4 border-background animate-ping" />
                        <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-4 border-background" />
                        <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            At Customer
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        </p>
                        <p className="text-xs font-black text-amber-500 mt-1">
                            {/* Correctly ticks from arrived_at, not started_at */}
                            Waiting: {formatDuration(stop.arrived_at, null, currentTime)}
                        </p>
                    </div>
                )}

                {/* Resolved */}
                {(isCompleted || isSkipped) && dl.started_at && (stop.completed_at || dl.completed_at) && (
                    <div className="relative">
                        <span className={cn(
                            'absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-4 border-background',
                            isCompleted ? 'bg-emerald-500' : 'bg-destructive'
                        )} />
                        <p className="font-bold text-xs text-foreground">
                            {getStatusLabel(stop.status, dl.status).label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {new Date(stop.completed_at || dl.completed_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs font-black text-emerald-600 mt-1">
                            Total Duration: {formatDuration(dl.started_at, stop.completed_at || dl.completed_at, currentTime)}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
};
