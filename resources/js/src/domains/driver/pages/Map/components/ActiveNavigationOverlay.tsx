import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface ActiveNavigationOverlayProps {
    task: any;
    route: any;
    leg: 'pickup' | 'dropoff';
    isPending: boolean;
    onArriveAtPickup: () => void;
    onCompleteTask: (taskId: string) => void;
    onStop: () => void;
    onArriveAtDeliveryStop?: (stopId: string) => void;
}

export const ActiveNavigationOverlay: React.FC<ActiveNavigationOverlayProps> = ({
    task,
    route,
    leg,
    isPending,
    onArriveAtPickup,
    onCompleteTask,
    onStop,
    onArriveAtDeliveryStop
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!task || !route) return null;

    const isDelivery = !!task.delivery;
    const title = isDelivery 
        ? `Stop #${task.sequence_number}: ${task.delivery.order.customer.name}` 
        : task.title;

    const subtitle = isDelivery
        ? `Delivery drop-off • ${(route.distance / 1000).toFixed(2)} km remaining`
        : `${leg === 'pickup' && task.pickup_lat ? "Leg 1: To Pickup" : "Leg 2: To Drop-off"} • ${(route.distance / 1000).toFixed(2)} km remaining`;

    return (
        <div className="absolute top-4 left-4 right-4 z-30 max-w-sm mx-auto bg-card/95 backdrop-blur-md border border-emerald-500/25 rounded-2xl p-3 shadow-xl transition-all duration-300 pointer-events-auto">
            {isCollapsed ? (
                /* COLLAPSED MODE: Ultra-compact single horizontal line banner */
                <div className="flex items-center justify-between gap-2.5">
                    <div 
                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none"
                        onClick={() => setIsCollapsed(false)}
                        title="Click to Expand Details"
                    >
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-bold text-xs text-foreground truncate uppercase tracking-wider">
                            {title}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {Math.round(route.duration / 60)}m • {(route.distance / 1000).toFixed(1)}km
                        </span>
                        <button 
                            onClick={() => setIsCollapsed(false)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all active:scale-90"
                            title="Expand Details"
                        >
                            <ChevronDown size={15} />
                        </button>
                        <button 
                            onClick={onStop}
                            className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-muted transition-all active:scale-95"
                        >
                            Stop
                        </button>
                    </div>
                </div>
            ) : (
                /* EXPANDED MODE: Complete active navigation details and actions */
                <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                        <div 
                            className="flex items-center gap-2 cursor-pointer select-none flex-1"
                            onClick={() => setIsCollapsed(true)}
                            title="Click to Collapse Details"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                                Active Navigation
                            </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={() => setIsCollapsed(true)}
                                className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all active:scale-90"
                                title="Collapse Details"
                            >
                                <ChevronUp size={15} />
                            </button>
                            <button 
                                onClick={onStop}
                                className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-xl bg-muted transition-all active:scale-95"
                            >
                                Stop
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 bg-muted/20 p-3.5 rounded-xl border border-border/30">
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-foreground truncate">
                                {title}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                                {subtitle}
                            </span>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="block font-black text-base text-emerald-500 leading-none">
                                {Math.round(route.duration / 60)} mins
                            </span>
                            <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-black mt-1 block">
                                Est. Time
                            </span>
                        </div>
                    </div>

                    {isDelivery ? (
                        <button
                            onClick={() => onArriveAtDeliveryStop?.(task.id)}
                            disabled={isPending}
                            className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
                        >
                            {isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Target size={14} className="animate-pulse" />
                            )}
                            <span>{isPending ? 'Arriving...' : 'Arrived at Stop'}</span>
                        </button>
                    ) : (
                        leg === 'pickup' && task.pickup_lat ? (
                            <button
                                onClick={onArriveAtPickup}
                                disabled={isPending}
                                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
                            >
                                {isPending ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Target size={14} className="animate-pulse" />
                                )}
                                <span>{isPending ? "Arriving..." : "Arrived at Pickup"}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => onCompleteTask(task.id)}
                                disabled={isPending}
                                className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10"
                            >
                                {isPending ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : null}
                                <span>{isPending ? "Completing..." : "Complete Errand"}</span>
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
};
