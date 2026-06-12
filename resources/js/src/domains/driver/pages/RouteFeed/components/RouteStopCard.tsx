import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, ChevronRight, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteStopCardProps {
    stop: any;
    onViewDetails: () => void;
    onArriveClick: () => void;
    isArrivePending: boolean;
    statusBadge: { label: string; className: string };
    durationText: string;
    showTransitTimer: boolean;
    showArrivedTimer: boolean;
    showCompletedTimer: boolean;
}

export const RouteStopCard: React.FC<RouteStopCardProps> = ({
    stop,
    onViewDetails,
    onArriveClick,
    isArrivePending,
    statusBadge,
    durationText,
    showTransitTimer,
    showArrivedTimer,
    showCompletedTimer,
}) => {
    const dl = stop.delivery;
    if (!dl) return null;

    const order = dl.order;
    const isCompleted = stop.status === 'completed';
    const canArrive = stop.status === 'pending' || stop.status === 'in_transit';

    return (
        <div
            onClick={onViewDetails}
            className={cn(
                "p-4 bg-white rounded-2xl shadow-sm shadow-black/5 transition-all duration-300 border-none flex flex-col gap-3.5 hover:shadow-md active:scale-[0.99] cursor-pointer",
                isCompleted && "opacity-70 mix-blend-luminosity"
            )}
        >
            {/* Top Row Header Block matching StopHeaderCard */}
            <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                            Stop #{stop.sequence_number}
                        </span>
                        <Badge className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-none", statusBadge.className)}>
                            {statusBadge.label}
                        </Badge>
                    </div>
                    <h3 className="text-base font-black text-foreground tracking-tight mt-1 truncate">
                        {order?.customer?.name || 'Walk-in Customer'}
                    </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg shrink-0">
                    #{dl.tracking_number.slice(-8)}
                </span>
            </div>

            {/* Address Content Body */}
            <div className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                <span className="truncate text-muted-foreground text-xs">{dl.dropoff_address}</span>
            </div>

            {/* Bottom Row Action and Financial Metadata Metrics */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex flex-col gap-1">
                    {order && (
                        <>
                            <div className="flex items-center font-black text-sm text-foreground bg-gray-50/80 dark:bg-muted/40 p-1 px-2 rounded-lg w-fit">
                                <span className="text-emerald-500 font-black flex items-center">
                                    <DollarSign size={12} className="stroke-[3]" />
                                    {(parseFloat(order.amount_due_cod) || 0).toFixed(2)}
                                </span>
                                <span className="text-[9px] text-muted-foreground uppercase font-bold ml-1.5 tracking-wider">COD</span>
                            </div>
                            
                            {/* Live Watch Ticker Elements */}
                            {(showCompletedTimer || showTransitTimer || showArrivedTimer) && (
                                <div className={cn(
                                    "flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded w-fit",
                                    showCompletedTimer && "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/10",
                                    showTransitTimer && "text-sky-600 bg-sky-50 dark:bg-sky-950/10 animate-pulse",
                                    showArrivedTimer && "text-amber-600 bg-amber-50 dark:bg-amber-950/10 animate-pulse"
                                )}>
                                    <Clock size={10} className="stroke-[2.5]" />
                                    <span>{showTransitTimer ? 'Transit: ' : showArrivedTimer ? 'Waiting: ' : 'Duration: '}{durationText}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Tactical Context Actions Area */}
                {canArrive ? (
                    <Button
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onArriveClick();
                        }}
                        className={cn(
                            "h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider gap-1.5 shadow-sm transition-all active:scale-95 border-none",
                            stop.status === 'in_transit' ? "bg-sky-500 hover:bg-sky-600 text-white" : "bg-primary text-primary-foreground"
                        )}
                        disabled={isArrivePending}
                    >
                        <Navigation size={11} className="stroke-[2.5]" />
                        {stop.status === 'in_transit' ? 'Arrived?' : 'Arrive'}
                    </Button>
                ) : (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-wider bg-muted/40 hover:bg-muted/80 px-2.5 h-8 rounded-xl transition-colors">
                        <span>Details</span>
                        <ChevronRight size={12} />
                    </div>
                )}
            </div>
        </div>
    );
};