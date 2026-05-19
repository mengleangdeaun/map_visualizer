import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { toast } from 'sonner';
import {
    Trash2, Zap, Send, MapPin, Clock, Navigation, X, RefreshCw, Weight, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Route, RouteStop } from '../../../services/routeService';

const routeStatusColors: Record<string, string> = {
    draft:       'bg-muted text-muted-foreground border border-border',
    optimized:   'bg-primary/15 text-primary border border-primary/20',
    in_progress: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
    completed:   'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    cancelled:   'bg-destructive/10 text-destructive border border-destructive/20',
};

const stopStatusColors: Record<string, string> = {
    pending:    'bg-muted text-muted-foreground border border-border/10',
    in_transit: 'bg-primary/15 text-primary border border-primary/10',
    arrived:    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/10',
    completed:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10',
    skipped:    'bg-destructive/10 text-destructive border border-destructive/10',
};

interface RoutePanelProps {
    activeRoute: Route | null;
    isLoading: boolean;
    drivers: any[];
    onDelete: (id: string) => void;
    onAssignDriver: (driverId: string | null) => void;
    onOptimize: (id: string) => void;
    onPublish: (id: string) => void;
    onRemoveStop: (stopId: string) => void;
    onReorder: (orderedDeliveryIds: string[]) => void;
    isOptimizePending: boolean;
    isPublishPending: boolean;
    isDeletePending: boolean;
    isRemoveStopPending: boolean;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
    activeRoute,
    isLoading,
    drivers,
    onDelete,
    onAssignDriver,
    onOptimize,
    onPublish,
    onRemoveStop,
    onReorder,
    isOptimizePending,
    isPublishPending,
    isDeletePending,
    isRemoveStopPending,
}) => {
    // ── Local stops sequence for optimistic Drag-and-Drop ──
    const [localStops, setLocalStops] = useState<RouteStop[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        if (activeRoute?.stops) {
            setLocalStops(activeRoute.stops);
        } else {
            setLocalStops([]);
        }
    }, [activeRoute?.stops]);

    // ── Drag & Drop Handlers ──
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Drag ghost transparent styling support
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, droppedIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === droppedIndex) return;

        // Perform optimistic array splice reorder
        const reordered = [...localStops];
        const [removedStop] = reordered.splice(draggedIndex, 1);
        reordered.splice(droppedIndex, 0, removedStop);

        // Instantly recalculate sequence numbers locally
        const updatedStops = reordered.map((stop, i) => ({
            ...stop,
            sequence_number: i + 1,
        }));

        setLocalStops(updatedStops);
        handleDragEnd();

        // Broadcast backend resequence sync
        const orderedDeliveryIds = updatedStops.map((s) => s.delivery_id);
        onReorder(orderedDeliveryIds);
    };

    // ── Beautiful timezone-safe Date & Time Formatters ──
    const formatStopEta = (etaStr: string | null) => {
        if (!etaStr) return '—';
        try {
            const date = new Date(etaStr);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return '—';
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        try {
            const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            const [year, month, day] = cleanStr.split('-');
            if (!year || !month || !day) return dateStr;
            
            const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
            return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    if (isLoading) {
        return (
            <div className="w-full flex flex-col justify-center items-center h-full bg-card">
                <RefreshCw className="size-8 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground mt-2 font-semibold">Loading Route...</span>
            </div>
        );
    }

    if (!activeRoute) {
        return (
            <div className="w-full flex flex-col justify-center items-center p-8 text-center bg-card h-full">
                <div className="max-w-[240px] space-y-4">
                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                        <Navigation className="size-8 text-primary animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-foreground">Select a Route</h3>
                        <p className="text-xs text-muted-foreground mt-1">Choose an existing route from the left sidebar or create a new one to begin dispatch sequencing.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col min-h-0 bg-background h-full">
            {/* Header */}
            <div className="p-4 border-b border-border/40 space-y-4 flex-shrink-0 bg-muted/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-base font-extrabold text-foreground tracking-tight">
                            {formatDate(activeRoute.date)}
                        </h2>
                        <div className="mt-1 flex items-center gap-2">
                            <span className={cn('text-[9px] font-semibold capitalize px-2 py-0.5 rounded-full tracking-wider', routeStatusColors[activeRoute.status])}>
                                {activeRoute.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl"
                        onClick={() => onDelete(activeRoute.id)}
                        disabled={isDeletePending}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>

                {/* Driver Assignment Selection */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Assigned Driver</Label>
                    <SearchableSelect
                        options={drivers}
                        value={activeRoute.driver_id ?? ''}
                        onChange={onAssignDriver}
                        placeholder="Select Driver..."
                        getOptionValue={(d: any) => d.id}
                        getOptionLabel={(d: any) => `${d.name} (${d.phone})`}
                        getOptionSearchTerms={(d: any) => [d.name, d.phone]}
                        renderOption={(d: any) => (
                            <div className="flex flex-col py-0.5">
                                <span className="font-bold text-xs">{d.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{d.phone}</span>
                            </div>
                        )}
                    />
                </div>

                {/* Micro KPIs widgets */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Stops', value: activeRoute.stop_count, icon: MapPin },
                        { label: 'Weight', value: `${activeRoute.total_weight_kg} kg`, icon: Weight },
                        { label: 'Distance', value: activeRoute.estimated_distance_km ? `${activeRoute.estimated_distance_km} km` : '—', icon: Navigation },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="dark:bg-gradient-to-b bg-muted/30 from-card to-background rounded-xl p-2.5 text-center transition-all duration-200">
                            <Icon className="size-4 text-primary/80 mx-auto mb-1" />
                            <span className="text-xs font-black text-foreground block tracking-tight">{value}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Command actions */}
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 text-xs gap-1.5 font-bold border-primary/20 text-primary hover:bg-primary/10 rounded-xl"
                        disabled={isOptimizePending || activeRoute.stop_count < 2}
                        onClick={() => onOptimize(activeRoute.id)}
                    >
                        {isOptimizePending ? (
                            <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                            <Zap className="size-3.5" />
                        )}
                        Optimize Order
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 h-9 text-xs gap-1.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 rounded-xl"
                        disabled={isPublishPending || !activeRoute.driver_id || activeRoute.stop_count === 0}
                        onClick={() => onPublish(activeRoute.id)}
                    >
                        {isPublishPending ? (
                            <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                            <Send className="size-3.5" />
                        )}
                        Publish Route
                    </Button>
                </div>
            </div>

            {/* List of stops with Drag-and-Drop support */}
            <ScrollArea className="flex-1 min-h-0 bg-muted/5">
                <div className="p-3 space-y-2">
                    {localStops.length === 0 && (
                        <div className="text-center py-12 text-xs text-muted-foreground/60 font-semibold">
                            No stops assigned yet.<br />
                            Click pins on the map to add deliveries here.
                        </div>
                    )}

                    {localStops.map((stop, index) => {
                        const trackingNumber = stop.delivery?.tracking_number;
                        const customerName = stop.delivery?.order?.customer?.name;
                        const dropoffAddress = stop.delivery?.dropoff_address;
                        const isDragging = index === draggedIndex;
                        const isOver = index === dragOverIndex;
                        
                        return (
                            <div
                                key={stop.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDrop={(e) => handleDrop(e, index)}
                                className={cn(
                                    'flex items-start gap-2.5 p-2.5 bg-card rounded-xl border transition-all duration-200 shadow-sm cursor-grab active:cursor-grabbing select-none',
                                    isDragging ? 'opacity-40 border-primary ring-1 ring-primary/20 scale-[0.98]' : 'border-border/40 hover:border-primary/20',
                                    isOver && !isDragging && 'border-dashed border-primary bg-primary/5'
                                )}
                            >
                                {/* Grip Drag Handle Icon */}
                                <div className="h-7 flex items-center justify-center shrink-0 cursor-grab text-muted-foreground/45 hover:text-primary transition-colors">
                                    <GripVertical className="size-4" />
                                </div>

                                {/* Sequential numbered badge */}
                                <div className={cn(
                                    'size-7 flex-shrink-0 rounded-full flex items-center justify-center font-black text-white text-xs border border-white shadow-md',
                                    stop.status === 'completed' ? 'bg-emerald-500' :
                                    stop.status === 'skipped'   ? 'bg-rose-500' : 'bg-primary'
                                )}>
                                    {stop.sequence_number}
                                </div>

                                {/* Stop Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-1.5">
                                        <span className="text-xs font-extrabold text-foreground truncate max-w-[130px]">
                                            {customerName ?? '—'}
                                        </span>
                                        {trackingNumber && (
                                            <button
                                                title="Click to copy tracking number"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Avoid triggering card events
                                                    navigator.clipboard.writeText(trackingNumber);
                                                    toast.success('Tracking number copied');
                                                }}
                                                className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-all duration-200 text-muted-foreground border border-border/40 shrink-0 cursor-copy"
                                            >
                                                {trackingNumber}
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block truncate mt-1">
                                        {dropoffAddress ?? 'No drop-off address set'}
                                    </span>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={cn('text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide', stopStatusColors[stop.status])}>
                                            {stop.status}
                                        </span>
                                        {stop.leg_distance_km && (
                                            <span className="text-[9px] text-slate-500 font-mono font-bold">
                                                +{stop.leg_distance_km} km
                                            </span>
                                        )}
                                        {stop.eta && (
                                            <span className="text-[9px] text-slate-500 font-mono font-bold flex items-center gap-0.5">
                                                <Clock className="size-2.5 text-slate-400" />
                                                {formatStopEta(stop.eta)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Detach button */}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6 flex-shrink-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Avoid triggering drag events
                                        onRemoveStop(stop.id);
                                    }}
                                    disabled={isRemoveStopPending}
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};
