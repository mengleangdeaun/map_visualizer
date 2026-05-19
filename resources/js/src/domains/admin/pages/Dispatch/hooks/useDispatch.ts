import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routeService } from '../../../services/routeService';
import { deliveryService } from '../../../services/deliveryService';
import { toast } from 'sonner';
import api from '@/lib/api';

// ── Queries ───────────────────────────────────────────────────────────────────

export const useRoutes = () =>
    useQuery({
        queryKey: ['admin', 'routes'],
        queryFn: () => routeService.getRoutes({ per_page: 50 }),
    });

export const useRoute = (id: string | null) =>
    useQuery({
        queryKey: ['admin', 'route', id],
        queryFn: () => routeService.getRoute(id!),
        enabled: !!id,
    });

export const useUnassignedDeliveries = () =>
    useQuery({
        queryKey: ['admin', 'deliveries', 'unassigned'],
        queryFn: () => deliveryService.getDeliveries({ per_page: 100, status: 'pending' }),
    });

export const useDrivers = () =>
    useQuery({
        queryKey: ['admin', 'drivers'],
        queryFn: () => api.get('/admin/fleet/users?per_page=100').then(r => r.data),
    });

export const useHubs = () =>
    useQuery({
        queryKey: ['fleet', 'locations'],
        queryFn: () => api.get('/fleet/locations?per_page=100').then(r => r.data),
    });

// ── Mutations ─────────────────────────────────────────────────────────────────

export const useCreateRoute = (onSuccess?: (routeId: string) => void) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => routeService.createRoute(data),
        onSuccess: (route) => {
            qc.invalidateQueries({ queryKey: ['admin', 'routes'] });
            onSuccess?.(route.id);
            toast.success('Route created');
        },
    });
};

export const useUpdateRoute = (selectedRouteId: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            routeService.updateRoute(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'routes'] });
            qc.invalidateQueries({ queryKey: ['admin', 'route', selectedRouteId] });
            toast.success('Route updated');
        },
    });
};

export const useAddStops = (selectedRouteId: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ routeId, deliveryIds }: { routeId: string; deliveryIds: string[] }) =>
            routeService.addStops(routeId, deliveryIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'route', selectedRouteId] });
            qc.invalidateQueries({ queryKey: ['admin', 'deliveries', 'unassigned'] });
            toast.success('Stop added to route');
        },
    });
};

export const useRemoveStop = (selectedRouteId: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ routeId, stopId }: { routeId: string; stopId: string }) =>
            routeService.removeStop(routeId, stopId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'route', selectedRouteId] });
            qc.invalidateQueries({ queryKey: ['admin', 'deliveries', 'unassigned'] });
            toast.success('Stop removed');
        },
    });
};

export const useOptimizeRoute = (selectedRouteId: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (routeId: string) => routeService.optimizeRoute(routeId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'route', selectedRouteId] });
            toast.success('Route optimized with nearest-neighbor + OSRM');
        },
        onError: () => toast.error('Optimization failed'),
    });
};

export const usePublishRoute = (selectedRouteId: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (routeId: string) => routeService.publishRoute(routeId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'routes'] });
            qc.invalidateQueries({ queryKey: ['admin', 'route', selectedRouteId] });
            toast.success('Route published — driver notified via Reverb!');
        },
        onError: () => toast.error('Failed to publish route'),
    });
};

export const useDeleteRoute = (onSuccess?: () => void) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (routeId: string) => routeService.deleteRoute(routeId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'routes'] });
            onSuccess?.();
            toast.success('Route deleted');
        },
    });
};

export const useReorderStops = (selectedRouteId: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ routeId, orderedDeliveryIds }: { routeId: string; orderedDeliveryIds: string[] }) =>
            routeService.reorderStops(routeId, orderedDeliveryIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'route', selectedRouteId] });
            toast.success('Route sequence reordered successfully');
        },
        onError: () => toast.error('Failed to reorder sequence'),
    });
};
