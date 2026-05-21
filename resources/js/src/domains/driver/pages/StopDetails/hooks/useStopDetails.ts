import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pwaToast as toast } from '../../../store/usePwaToastStore';
import { useNavigationStore } from '../../../store/useNavigationStore';
import api from '@/lib/api';
import { useNavigate } from '@tanstack/react-router';
import type { RouteStop } from '../types';
import { useLocationStore } from '../../../store/useLocationStore';

// ── Duration Formatter ────────────────────────────────────────────────────────

export const formatDuration = (
    startedAt: string | null,
    endAt: string | null,
    currentTime: number
): string => {
    if (!startedAt) return '';
    const start = new Date(startedAt).getTime();
    const end = endAt ? new Date(endAt).getTime() : currentTime;
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

// ── Status Label Helper ───────────────────────────────────────────────────────

export const getStatusLabel = (stopStatus: string, deliveryStatus: string) => {
    switch (stopStatus) {
        case 'completed':
            return { label: 'Delivered', className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-none' };
        case 'skipped':
            return deliveryStatus === 'rescheduled'
                ? { label: 'Rescheduled', className: 'bg-amber-500 hover:bg-amber-600 text-white border-none' }
                : { label: 'Failed', className: 'bg-destructive hover:bg-destructive text-destructive-foreground border-none' };
        case 'in_transit':
            return { label: 'In Transit', className: 'bg-sky-500 hover:bg-sky-600 text-white border-none' };
        case 'arrived':
            return { label: 'Arrived', className: 'bg-blue-500 hover:bg-blue-600 text-white border-none animate-pulse' };
        default:
            return { label: 'Pending', className: 'bg-muted hover:bg-muted text-muted-foreground border-none' };
    }
};

// ── Main Hook ─────────────────────────────────────────────────────────────────

export const useStopDetails = (id: string | undefined) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { clearNavigation } = useNavigationStore();

    // Live tick for stopwatch timers
    const [currentTime, setCurrentTime] = useState(Date.now());

    const { data: routeData, isLoading } = useQuery({
        queryKey: ['driver', 'route', 'active'],
        queryFn: async () => {
            const { data } = await api.get('/driver/route/active');
            return data.data;
        },
        // Always fetch fresh data when this page mounts — ensures status (arrived/in_transit)
        // is never read from a stale cache, e.g. when navigating from the map overlay.
        refetchOnMount: 'always',
    });

    const stop: RouteStop | undefined = routeData?.stops?.find((s: RouteStop) => s.id === id);
    const isActiveStop = stop?.status === 'arrived' || stop?.status === 'in_transit';

    useEffect(() => {
        if (!isActiveStop) return;
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isActiveStop]);

    // ── Arrive Mutation ───────────────────────────────────────────────────────
    const arriveMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/driver/route/stops/${id}/arrive`);
            return data;
        },
        onSuccess: () => {
            toast.success('Arrival confirmed');
            if ('vibrate' in navigator) navigator.vibrate(100);
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to confirm arrival');
        },
    });

    // ── Complete Mutation (POD) ───────────────────────────────────────────────
    const completeMutation = useMutation({
        mutationFn: async ({ photo, notes }: { photo: File | null; notes: string }) => {
            const { latitude, longitude } = useLocationStore.getState();
            const formData = new FormData();
            formData.append('notes', notes);
            if (photo) formData.append('photo', photo);
            if (latitude !== null) formData.append('latitude', latitude.toString());
            if (longitude !== null) formData.append('longitude', longitude.toString());
            const { data } = await api.post(`/driver/route/stops/${id}/complete`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            toast.success('Stop resolved successfully as delivered!');
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
            clearNavigation();
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
            navigate({ to: '/driver/route' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to submit resolution');
        },
    });

    // ── Fail Mutation ─────────────────────────────────────────────────────────
    const failMutation = useMutation({
        mutationFn: async ({ reasonCode, notes }: { reasonCode: string; notes: string }) => {
            const { data } = await api.post(`/driver/route/stops/${id}/fail`, {
                reason_code: reasonCode,
                notes,
            });
            return data;
        },
        onSuccess: () => {
            toast.warning('Stop exception logged');
            if ('vibrate' in navigator) navigator.vibrate([150, 50, 150]);
            clearNavigation();
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
            navigate({ to: '/driver/route' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to log exception');
        },
    });

    return {
        stop,
        isLoading,
        currentTime,
        arriveMutation,
        completeMutation,
        failMutation,
    };
};
