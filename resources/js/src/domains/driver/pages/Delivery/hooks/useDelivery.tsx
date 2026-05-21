import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeaderStore } from '@/domains/driver/store/useHeaderStore';
import { pwaToast as toast } from '@/domains/driver/store/usePwaToastStore';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { echo } from '@/lib/echo';
import { deliveryService } from '../services/deliveryService';
import { ActiveRoute } from '../types';

export const useDelivery = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const setHeader = useHeaderStore(s => s.setHeader);

    // Real-time tick stopwatch for active/arrived stops
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Setup dynamic header with action button
    useEffect(() => {
        setHeader({ 
            title: t('deliveries') || 'Deliveries',
            showBackButton: false,
            rightAction: (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-9 rounded-xl hover:bg-muted shrink-0 transition-all active:scale-95"
                    onClick={() => navigate({ to: '/driver/tasks' })}
                    title={t('my_tasks') || 'Tasks'}
                >
                    <ListChecks size={20} className="text-muted-foreground hover:text-foreground" />
                </Button>
            )
        });
        return () => setHeader({});
    }, [setHeader, t, navigate]);

    // Query active route
    const { data: route = null, isLoading, refetch } = useQuery<ActiveRoute | null>({
        queryKey: ['driver', 'route', 'active'],
        queryFn: () => deliveryService.getActiveRoute(),
    });

    // Mutation to mark arrived
    const arriveMutation = useMutation({
        mutationFn: (stopId: string) => deliveryService.confirmArrival(stopId),
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

    // Setup active ticking stopwatch for transit/arrived stops
    const stopsList = route?.stops || [];
    const hasActiveStop = stopsList.some(s => s.status === 'arrived' || s.status === 'in_transit');
    
    useEffect(() => {
        if (hasActiveStop) {
            const timer = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [hasActiveStop]);

    // Listen for Laravel Reverb (Echo) private channel broadcasts when admin assigns a route to this driver
    useEffect(() => {
        if (!user?.id) return;

        const channelName = `driver.${user.id}`;
        const channel = echo.private(channelName);

        channel.listen('.route.assigned', (event: any) => {
            // Refetch active route instantly without refresh
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });

            const stopCount = event?.route?.stop_count ?? 0;
            const distance = event?.route?.estimated_distance_km
                ? ` · ${event.route.estimated_distance_km} km`
                : '';

            toast.success(`📦 New route assigned — ${stopCount} stops${distance}`);

            if ('vibrate' in navigator) {
                navigator.vibrate([150, 80, 150]);
            }
        });

        return () => {
            channel.stopListening('.route.assigned');
        };
    }, [user?.id, queryClient]);

    const handleArrive = useCallback((stopId: string) => {
        arriveMutation.mutate(stopId);
    }, [arriveMutation]);

    return {
        t,
        route,
        isLoading,
        refetch,
        currentTime,
        isArrivePending: arriveMutation.isPending,
        updatingStopId: arriveMutation.variables || null,
        handleArrive,
        navigate
    };
};
