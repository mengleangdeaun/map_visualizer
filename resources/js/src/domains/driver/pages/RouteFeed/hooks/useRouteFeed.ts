import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeaderStore } from '@/domains/driver/store/useHeaderStore';
import { pwaToast as toast } from '../../../store/usePwaToastStore';
import api from '@/lib/api';

export const useRouteFeed = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const setHeader = useHeaderStore((s) => s.setHeader);

    // Dynamic millisecond clock state for live transit/waiting counters
    const [currentTime, setCurrentTime] = useState(Date.now());

    // ── Global App Header Synced Sync ─────────────────────────────────────────
    useEffect(() => {
        setHeader({
            title: t('active_route') || 'Active Route',
            showBackButton: true,
            backTarget: '/driver',
        });
        return () => setHeader({});
    }, [setHeader, t]);

    // ── Queries ───────────────────────────────────────────────────────────────
    const { data: route, isLoading, refetch } = useQuery({
        queryKey: ['driver', 'route', 'active'],
        queryFn: async () => {
            const { data } = await api.get('/driver/route/active');
            return data.data;
        },
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
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
        },
    });

    // ── Live Counter Stopwatch Lifecycle Effect ──────────────────────────────
    const stopsList = route?.stops || [];
    const hasActiveStop = stopsList.some((s: any) => s.status === 'arrived' || s.status === 'in_transit');

    useEffect(() => {
        if (!hasActiveStop) return;
        
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        
        return () => clearInterval(timer);
    }, [hasActiveStop]);

    // ── Helpers & Utilities ───────────────────────────────────────────────────
    const getStatusLabelAndColor = (stopStatus: string, deliveryStatus: string) => {
        if (stopStatus === 'completed') {
            return {
                label: t('delivered') || 'Delivered',
                className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-none',
            };
        }
        if (stopStatus === 'skipped') {
            if (deliveryStatus === 'rescheduled') {
                return {
                    label: t('rescheduled') || 'Rescheduled',
                    className: 'bg-amber-500 hover:bg-amber-600 text-white border-none',
                };
            }
            return {
                label: t('failed') || 'Failed',
                className: 'bg-destructive hover:bg-destructive text-destructive-foreground border-none',
            };
        }
        if (stopStatus === 'in_transit') {
            return {
                label: t('in_transit') || 'In Transit',
                className: 'bg-sky-500 hover:bg-sky-600 text-white border-none',
            };
        }
        if (stopStatus === 'arrived') {
            return {
                label: t('arrived') || 'Arrived',
                className: 'bg-blue-500 hover:bg-blue-600 text-white border-none animate-pulse',
            };
        }
        return {
            label: t('pending') || 'Pending',
            className: 'bg-muted hover:bg-muted text-muted-foreground border-none',
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

        if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    const completedCount = stopsList.filter((s: any) => s.status === 'completed').length;

    return {
        route,
        isLoading,
        refetch,
        arriveMutation,
        completedCount,
        getStatusLabelAndColor,
        formatDuration,
    };
};