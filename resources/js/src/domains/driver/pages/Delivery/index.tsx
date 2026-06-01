import React from 'react';
import { Map, Truck, Route } from 'lucide-react';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { useDelivery } from './hooks/useDelivery';
import { DeliveryProgressCard } from './components/DeliveryProgressCard';
import { StopCard } from './components/StopCard';
import { DeliverySkeleton } from './components/DeliverySkeleton';

const DeliveryPage: React.FC = React.memo(() => {
    const {
        t,
        route,
        isLoading,
        refetch,
        currentTime,
        isArrivePending,
        updatingStopId,
        handleArrive,
        navigate
    } = useDelivery();

    if (isLoading) {
        return <DeliverySkeleton />;
    }

    if (!route) {
        return (
            <PullToRefresh onRefresh={async () => { await refetch(); }}>
                <div className="px-4 py-3 flex flex-col gap-4 max-w-md mx-auto animate-in fade-in duration-500 pb-24 h-[calc(100vh-140px)] select-none">
                    {/* Header Count Badge */}
                    <div className="flex items-center justify-between px-1 shrink-0">
                        <h1 className="text-lg font-black tracking-tight text-gray-800">
                            {t('driver:active_route') || 'Active Route'}
                        </h1>
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            0 {t('driver:stops') || 'Stops'}
                        </span>
                    </div>

                    {/* Centered Empty State */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-full flex flex-col items-center justify-center p-8 bg-card/20 border border-dashed border-border/80 rounded-2xl shadow-none animate-in fade-in duration-300">
                            <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground/60">
                                <Route size={22} />
                            </div>
                            <h3 className="text-sm font-bold text-foreground tracking-tight mb-1 text-center">
                                {t('no_active_route') || 'No Active Route'}
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-[210px] leading-relaxed text-center mb-6">
                                {t('no_active_route_desc') || 'No active deliveries or route assigned for you today.'}
                            </p>
                            <Button 
                                variant="outline"
                                size="sm"
                                className="rounded-xl font-black text-[10px] h-9 px-4 uppercase tracking-wider text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40 transition-colors active:scale-[0.98]"
                                onClick={() => navigate({ to: '/driver/map' })}
                            >
                                <Map size={14} className="mr-1.5" />
                                {t('open_map') || 'Open Live Map'}
                            </Button>
                        </div>
                    </div>
                </div>
            </PullToRefresh>
        );
    }

    const stops = route.stops || [];
    const completedCount = stops.filter(s => s.status === 'completed').length;
    
    const totalCod = stops.reduce((acc, stop) => {
        const order = stop.delivery?.order;
        if (order && order.payment_method === 'cod') {
            return acc + (parseFloat(order.amount_due_cod.toString()) || 0);
        }
        return acc;
    }, 0);

    return (
        <PullToRefresh onRefresh={async () => { await refetch(); }}>
            <div className="p-4 flex flex-col gap-4 pb-24 max-w-md mx-auto animate-in fade-in duration-300">
                {/* 1. Progress & COD Summary Card */}
                <DeliveryProgressCard 
                    completedCount={completedCount}
                    totalStops={stops.length}
                    totalCod={totalCod}
                    t={t}
                />

                {/* 2. List Header */}
                <div className="flex items-center justify-between px-1 select-none">
                    <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                        {t('stops') || 'Route Stops'}
                    </h3>
                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {stops.length} {t('stops_count') || 'Stops'}
                    </span>
                </div>

                {/* 3. Stops Sequence Feed */}
                <div className="space-y-4">
                    {stops.map((stop) => (
                        <StopCard 
                            key={stop.id}
                            stop={stop}
                            currentTime={currentTime}
                            isArrivePending={isArrivePending}
                            updatingStopId={updatingStopId}
                            onArrive={handleArrive}
                            t={t}
                        />
                    ))}
                </div>
            </div>
        </PullToRefresh>
    );
});

DeliveryPage.displayName = 'DeliveryPage';

export default DeliveryPage;
