import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
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
    Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';

const RouteFeedPage = () => {
    const { t } = useTranslation(['delivery', 'driver']);
    const queryClient = useQueryClient();
    const setHeader = useHeaderStore(s => s.setHeader);

    useEffect(() => {
        setHeader({ 
            title: t('delivery:active_route') || 'Active Route',
            showBackButton: true,
            backTarget: '/driver'
        });
        return () => setHeader({});
    }, [setHeader, t]);

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

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-40" />
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    if (!route) {
        return (
            <div className="p-6 flex flex-col items-center justify-center text-muted-foreground gap-4 h-[60vh]">
                <Clock size={48} className="opacity-20" />
                <p className="font-semibold italic text-sm text-center">
                    No active deliveries or route assigned for you today.
                </p>
                <Button 
                    onClick={() => window.location.href = '/driver/map'}
                    className="h-11 rounded-2xl px-6 font-bold"
                >
                    <Map size={18} className="mr-2" />
                    Open Live Map
                </Button>
            </div>
        );
    }

    const stops = route.stops || [];
    const completedCount = stops.filter((s: any) => s.status === 'completed').length;

    return (
        <PullToRefresh onRefresh={refetch}>
            <div className="p-4 flex flex-col gap-4 pb-24">
                {/* 1. Header Metrics Card */}
                <Card className="p-4 border-none shadow-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-between gap-2">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                            {t('delivery:route_progress')}
                        </span>
                        <h2 className="text-xl font-black text-foreground">
                            {completedCount} / {stops.length} <span className="text-xs font-semibold text-muted-foreground">{t('delivery:stops_completed')}</span>
                        </h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {t('delivery:expected_cod')}
                        </span>
                        <div className="flex items-center gap-0.5 justify-end font-black text-lg text-foreground">
                            <DollarSign size={16} className="text-emerald-500" />
                            <span>{route.cash_to_remit.toFixed(2)}</span>
                        </div>
                    </div>
                </Card>

                {/* 2. Route Stops Sequence Feed List */}
                <div className="space-y-4">
                    {stops.map((stop: any, index: number) => {
                        const dl = stop.delivery;
                        const isArrived = stop.status === 'arrived';
                        const isCompleted = stop.status === 'completed';
                        const isSkipped = stop.status === 'skipped';

                        return (
                            <Card 
                                key={stop.id} 
                                onClick={() => window.location.href = `/driver/route/stop/${stop.id}`}
                                className={cn(
                                    "p-0 overflow-hidden border-none shadow-md bg-card transition-all duration-200 active:scale-[0.99] cursor-pointer",
                                    isCompleted && "opacity-75"
                                )}
                            >
                                <div className="flex items-center">
                                    {/* Stop Sequence Indicator Sidebar */}
                                    <div className={cn(
                                        "w-12 self-stretch flex items-center justify-center font-bold text-sm shrink-0",
                                        isCompleted ? "bg-muted text-muted-foreground border-r border-border" :
                                        isArrived ? "bg-amber-500 text-white" :
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
                                                <h3 className="font-bold text-foreground truncate">
                                                    {dl.order.customer.name}
                                                </h3>
                                            </div>
                                            <Badge variant={
                                                isCompleted ? "outline" :
                                                isArrived ? "default" :
                                                isSkipped ? "destructive" :
                                                "secondary"
                                            } className={cn(
                                                isArrived && "bg-amber-500 hover:bg-amber-600 text-white"
                                            )}>
                                                {t(`delivery:${stop.status}`)}
                                            </Badge>
                                        </div>

                                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                            <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                                            <span className="truncate">{dl.dropoff_address}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                            <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                                                <DollarSign size={14} />
                                                <span>{dl.order.amount_due_cod.toFixed(2)} COD</span>
                                            </div>

                                            {/* Stop actions hit area */}
                                            {stop.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Avoid card click navigate
                                                        arriveMutation.mutate(stop.id);
                                                    }}
                                                    className="h-9 px-4 rounded-xl font-bold text-xs"
                                                >
                                                    <Navigation size={12} className="mr-1.5" />
                                                    Arrive
                                                </Button>
                                            )}

                                            {(isArrived || isCompleted || isSkipped) && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                                                    <span>View details</span>
                                                    <ChevronRight size={14} />
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

export default RouteFeedPage;
