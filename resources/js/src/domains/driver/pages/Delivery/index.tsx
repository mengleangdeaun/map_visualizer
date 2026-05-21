import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useHeaderStore } from '../../store/useHeaderStore';
import { pwaToast as toast } from '../../store/usePwaToastStore';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    MapPin, 
    ChevronRight, 
    Navigation, 
    CheckCircle2, 
    Clock, 
    DollarSign,
    Map,
    ListChecks,
    Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';

const DeliveryPage = () => {
    const { t } = useTranslation(['delivery', 'driver']);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const setHeader = useHeaderStore(s => s.setHeader);

    // Real-time tick stopwatch for active/arrived stops
    const [currentTime, setCurrentTime] = useState(Date.now());

    const getStatusLabelAndColor = (stopStatus: string, deliveryStatus: string) => {
        if (stopStatus === 'completed') {
            return {
                label: t('delivery:delivered') || 'Delivered',
                className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-none'
            };
        }
        if (stopStatus === 'skipped') {
            if (deliveryStatus === 'rescheduled') {
                return {
                    label: t('delivery:rescheduled') || 'Rescheduled',
                    className: 'bg-amber-500 hover:bg-amber-600 text-white border-none'
                };
            }
            return {
                label: t('delivery:failed') || 'Failed',
                className: 'bg-destructive hover:bg-destructive text-destructive-foreground border-none'
            };
        }
        if (stopStatus === 'in_transit') {
            return {
                label: t('delivery:in_transit') || 'In Transit',
                className: 'bg-sky-500 hover:bg-sky-600 text-white border-none'
            };
        }
        if (stopStatus === 'arrived') {
            return {
                label: t('delivery:arrived') || 'Arrived',
                className: 'bg-blue-500 hover:bg-blue-600 text-white border-none animate-pulse'
            };
        }
        return {
            label: t('delivery:pending') || 'Pending',
            className: 'bg-muted hover:bg-muted text-muted-foreground border-none'
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

    useEffect(() => {
        setHeader({ 
            title: t('delivery:deliveries') || 'Deliveries',
            showBackButton: false,
            rightAction: (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-9 rounded-xl hover:bg-muted shrink-0 transition-all active:scale-95"
                    onClick={() => navigate({ to: '/driver/tasks' })}
                    title={t('driver:my_tasks') || 'Tasks'}
                >
                    <ListChecks size={20} className="text-muted-foreground hover:text-foreground" />
                </Button>
            )
        });
        return () => setHeader({});
    }, [setHeader, t, navigate]);

    // Query active route
    const { data: route, isLoading, refetch } = useQuery({
        queryKey: ['driver', 'route', 'active'],
        queryFn: async () => {
            const { data } = await api.get('/driver/route/active');
            return data.data;
        }
    });

    // Mutation to mark arrived
    const arriveMutation = useMutation({
        mutationFn: async (stopId: string) => {
            const { data } = await api.post(`/driver/route/stops/${stopId}/arrive`);
            return data;
        },
        onSuccess: () => {
            toast.success("Arrival confirmed");
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to confirm arrival");
        }
    });

    // Setup active ticking for transit/arrived stops
    const stopsList = route?.stops || [];
    const hasActiveStop = stopsList.some((s: any) => s.status === 'arrived' || s.status === 'in_transit');
    useEffect(() => {
        if (hasActiveStop) {
            const timer = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [hasActiveStop]);

    if (isLoading) {
        return (
            <div className="p-4 space-y-4 max-w-md mx-auto">
                <Skeleton className="h-10 w-48 rounded-xl" />
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!route) {
        return (
            <div className="p-6 flex flex-col items-center justify-center text-muted-foreground gap-4 h-[70vh] max-w-md mx-auto">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border mb-2">
                    <Truck size={32} className="opacity-30" />
                </div>
                <p className="font-black text-base text-foreground tracking-tight text-center">
                    {t('delivery:no_active_route') || 'No Active Route'}
                </p>
                <p className="text-xs font-semibold text-muted-foreground text-center leading-normal max-w-[240px]">
                    No active deliveries or route assigned for you today.
                </p>
                <Button 
                    onClick={() => navigate({ to: '/driver/map' })}
                    className="h-11 rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Map size={18} className="mr-2" />
                    {t('driver:open_map') || 'Open Live Map'}
                </Button>
            </div>
        );
    }

    const stops = route.stops || [];
    const completedCount = stops.filter((s: any) => s.status === 'completed').length;
    const totalCod = stops.reduce((acc: number, stop: any) => {
        const order = stop.delivery?.order;
        if (order && order.payment_method === 'cod') {
            return acc + (parseFloat(order.amount_due_cod) || 0);
        }
        return acc;
    }, 0);

    return (
        <PullToRefresh onRefresh={refetch}>
            <div className="p-4 flex flex-col gap-4 pb-24 max-w-md mx-auto animate-in fade-in duration-300">
                {/* 1. Progress & COD Summary Card */}
                <Card className="p-4 border-none shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                            {t('delivery:route_progress') || 'Route Progress'}
                        </span>
                        <h2 className="text-xl font-black text-foreground">
                            {completedCount} / {stops.length} <span className="text-xs font-semibold text-muted-foreground">{t('delivery:stops_completed') || 'stops'}</span>
                        </h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {t('delivery:expected_cod') || 'COD Balance'}
                        </span>
                        <div className="flex items-center gap-0.5 justify-end font-black text-xl text-foreground">
                            <DollarSign size={18} className="text-emerald-500" />
                            <span>{totalCod.toFixed(2)}</span>
                        </div>
                    </div>
                </Card>

                {/* 2. List Header */}
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                        {t('delivery:stops') || 'Route Stops'}
                    </h3>
                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {stops.length} {t('delivery:stops_count') || 'Stops'}
                    </span>
                </div>

                {/* 3. Stops Sequence Feed */}
                <div className="space-y-4">
                    {stops.map((stop: any) => {
                        const dl = stop.delivery;
                        if (!dl) return null;
                        
                        const isArrived = stop.status === 'arrived';
                        const isCompleted = stop.status === 'completed';
                        const isSkipped = stop.status === 'skipped';
                        const order = dl.order;

                        return (
                            <Card 
                                key={stop.id} 
                                onClick={() => navigate({ to: `/driver/route/stop/${stop.id}` })}
                                className={cn(
                                    "p-0 overflow-hidden border-none shadow-lg bg-card transition-all duration-200 active:scale-[0.98] cursor-pointer",
                                    isCompleted && "opacity-75"
                                )}
                            >
                                <div className="flex items-center">
                                    {/* Stop Sequence Indicator Sidebar */}
                                    <div className={cn(
                                        "w-12 self-stretch flex items-center justify-center font-black text-sm shrink-0 select-none",
                                        isCompleted ? "bg-muted text-muted-foreground border-r border-border" :
                                        stop.status === 'in_transit' ? "bg-sky-500 text-white animate-pulse" :
                                        isArrived ? "bg-amber-500 text-white animate-pulse" :
                                        "bg-primary text-primary-foreground"
                                    )}>
                                        {stop.sequence_number}
                                    </div>

                                    {/* Stop Details */}
                                    <div className="p-4 flex-1 min-w-0 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    #{dl.tracking_number}
                                                </span>
                                                <h3 className="font-bold text-foreground truncate text-sm">
                                                    {order?.customer?.name || 'Walk-in Customer'}
                                                </h3>
                                            </div>
                                            <Badge className={cn(
                                                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                getStatusLabelAndColor(stop.status, dl.status).className
                                            )}>
                                                {getStatusLabelAndColor(stop.status, dl.status).label}
                                            </Badge>
                                        </div>

                                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                            <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                                            <span className="truncate leading-normal">{dl.dropoff_address}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                            <div className="flex flex-col">
                                                {order && (
                                                    <>
                                                        <div className="flex items-center gap-0.5 text-xs font-black text-emerald-600">
                                                            <DollarSign size={14} />
                                                            <span>{(parseFloat(order.amount_due_cod) || 0).toFixed(2)} COD</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                                                                 {order.payment_status || 'unpaid'} • {order.payment_method || 'COD'}
                                                            </span>
                                                            {dl.started_at && (isCompleted || isSkipped) && dl.completed_at && (
                                                                <>
                                                                    <span className="text-[8px] text-muted-foreground">•</span>
                                                                    <div className="flex items-center gap-0.5 text-[8px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1 rounded shrink-0">
                                                                        <Clock size={8} />
                                                                        <span>{formatDuration(dl.started_at, dl.completed_at)}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {stop.status === 'in_transit' && dl.started_at && (
                                                                <>
                                                                    <span className="text-[8px] text-muted-foreground">•</span>
                                                                    <div className="flex items-center gap-0.5 text-[8px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/20 px-1 rounded shrink-0 animate-pulse">
                                                                        <Clock size={8} />
                                                                        <span>{formatDuration(dl.started_at, null)}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {stop.status === 'arrived' && dl.started_at && (
                                                                <>
                                                                    <span className="text-[8px] text-muted-foreground">•</span>
                                                                    <div className="flex items-center gap-0.5 text-[8px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1 rounded shrink-0 animate-pulse">
                                                                        <Clock size={8} />
                                                                        <span>{formatDuration(dl.started_at, null)}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Stop actions hit area */}
                                            {stop.status === 'pending' || stop.status === 'in_transit' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Avoid card click navigate
                                                        arriveMutation.mutate(stop.id);
                                                    }}
                                                    className={cn(
                                                        "h-8 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider gap-1 shadow-md shadow-primary/10 transition-all active:scale-95",
                                                        stop.status === 'in_transit' && "bg-sky-500 hover:bg-sky-600"
                                                    )}
                                                    disabled={arriveMutation.isPending}
                                                >
                                                    <Navigation size={10} />
                                                    {stop.status === 'in_transit' ? "Arrived?" : "Arrive"}
                                                </Button>
                                            ) : (
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-wider">
                                                    <span>View details</span>
                                                    <ChevronRight size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </PullToRefresh>
    );
};

export default DeliveryPage;
