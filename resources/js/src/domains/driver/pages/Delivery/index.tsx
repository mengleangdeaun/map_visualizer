import React from 'react';
import { Map, Truck } from 'lucide-react';
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
            <div className="p-6 flex flex-col items-center justify-center text-muted-foreground gap-4 h-[70vh] max-w-md mx-auto select-none">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border mb-2">
                    <Truck size={32} className="opacity-30" />
                </div>
                <h3 className="font-black text-base text-gray-800 dark:text-foreground tracking-tight text-center">
                    {t('no_active_route') || 'No Active Route'}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground text-center leading-normal max-w-[240px]">
                    No active deliveries or route assigned for you today.
                </p>
                <Button 
                    onClick={() => navigate({ to: '/driver/map' })}
                    className="h-11 rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Map size={18} className="mr-2" />
                    {t('open_map') || 'Open Live Map'}
                </Button>
            </div>
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
