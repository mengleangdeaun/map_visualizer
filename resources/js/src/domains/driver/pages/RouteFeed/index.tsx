import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';

import { useRouteFeed } from './hooks/useRouteFeed';
import { RouteMetricsCard } from './components/RouteMetricsCard';
import { RouteStopCard } from './components/RouteStopCard';
import { RouteEmptyState } from './components/RouteEmptyState';

const RouteFeedPage = () => {
    const navigate = useNavigate();
    const {
        route,
        isLoading,
        refetch,
        arriveMutation,
        completedCount,
        getStatusLabelAndColor,
        formatDuration,
    } = useRouteFeed();

    // ── Structural Loading Guard Screen ───────────────────────────────────────
    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-40" />
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    // ── Structural Empty State Guard Screen ───────────────────────────────────
    if (!route) {
        return (
            <RouteEmptyState
                onRefresh={async () => { await refetch(); }}
                onOpenMap={() => navigate({ to: '/driver/map' })}
            />
        );
    }

    const stops = route.stops || [];

    // ── Primary Component Layout Build ────────────────────────────────────────
    return (
        <PullToRefresh onRefresh={refetch}>
            <div className="p-4 flex flex-col gap-4 pb-24">
                
                <RouteMetricsCard
                    completedCount={completedCount}
                    totalStops={stops.length}
                    cashToRemit={route.cash_to_remit}
                />

                <div className="space-y-4">
                    {stops.map((stop: any) => {
                        const dl = stop.delivery;
                        if (!dl) return null;

                        const isCompleted = stop.status === 'completed';
                        const isSkipped = stop.status === 'skipped';

                        // Calculate conditional visibility matrices for indicators
                        const showCompletedTimer = dl.started_at && (isCompleted || isSkipped) && dl.completed_at;
                        const showTransitTimer = stop.status === 'in_transit' && dl.started_at;
                        const showArrivedTimer = stop.status === 'arrived' && dl.started_at;

                        return (
                            <RouteStopCard
                                key={stop.id}
                                stop={stop}
                                onViewDetails={() => navigate({ to: '/driver/route/stop/$id', params: { id: stop.id } })}
                                onArriveClick={() => arriveMutation.mutate(stop.id)}
                                isArrivePending={arriveMutation.isPending}
                                statusBadge={getStatusLabelAndColor(stop.status, dl.status)}
                                durationText={formatDuration(dl.started_at, isCompleted || isSkipped ? dl.completed_at : null)}
                                showCompletedTimer={!!showCompletedTimer}
                                showTransitTimer={!!showTransitTimer}
                                showArrivedTimer={!!showArrivedTimer}
                            />
                        );
                    })}
                </div>

            </div>
        </PullToRefresh>
    );
};

export default RouteFeedPage;