import React, { useState, useCallback } from 'react';
import { Route as RouteIcon, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from '@/components/ui/resizable';
import { RouteList } from './components/RouteList';
import { DispatchMap } from './components/DispatchMap';
import { RoutePanel } from './components/RoutePanel';
import {
    useRoutes, useRoute, useUnassignedDeliveries, useDrivers,
    useCreateRoute, useUpdateRoute, useAddStops, useRemoveStop,
    useOptimizeRoute, usePublishRoute, useDeleteRoute, useReorderStops
} from './hooks/useDispatch';
import { Delivery } from '../../services/deliveryService';

const DispatchPage: React.FC = () => {
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [mapViewport, setMapViewport] = useState({
        center: [104.9282, 11.5564] as [number, number],
        zoom: 11,
        bearing: 0,
        pitch: 0,
    });

    const queryClient = useQueryClient();

    // ── Queries ──
    const { data: routesData } = useRoutes();
    const { data: activeRoute, isLoading: routeLoading } = useRoute(selectedRouteId);
    const { data: unassignedData } = useUnassignedDeliveries();
    const { data: driversData } = useDrivers();

    // ── Mutations ──
    const createMutation = useCreateRoute((newRouteId) => setSelectedRouteId(newRouteId));
    const updateMutation = useUpdateRoute(selectedRouteId);
    const addStopsMutation = useAddStops(selectedRouteId);
    const removeStopMutation = useRemoveStop(selectedRouteId);
    const optimizeMutation = useOptimizeRoute(selectedRouteId);
    const publishMutation = usePublishRoute(selectedRouteId);
    const deleteMutation = useDeleteRoute(() => setSelectedRouteId(null));
    const reorderMutation = useReorderStops(selectedRouteId);

    const handlePinClick = useCallback((delivery: Delivery) => {
        if (!selectedRouteId) return;
        addStopsMutation.mutate({ routeId: selectedRouteId, deliveryIds: [delivery.id] });
    }, [selectedRouteId, addStopsMutation]);

    const handleAssignDriver = (driverId: string | null) => {
        if (!selectedRouteId) return;
        updateMutation.mutate({
            id: selectedRouteId,
            data: { driver_id: driverId }
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] }),
                queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries', 'unassigned'] }),
                selectedRouteId ? queryClient.invalidateQueries({ queryKey: ['admin', 'route', selectedRouteId] }) : Promise.resolve(),
            ]);
            toast.success('Dispatch board refreshed');
        } finally {
            // Tactile feedback pause
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] min-h-[500px] flex flex-col min-w-0 bg-background rounded-xl border border-border shadow-xs overflow-hidden">
            {/* Elegant Header with Action Refresh */}
            <div className="flex-shrink-0 p-4 border-b border-border/40 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <RouteIcon className="size-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-extrabold text-foreground tracking-tight">Route Dispatch Engine</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Sequence batch deliveries using intelligent heuristics & real-time telemetry.</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1.5 border-border rounded-xl bg-background hover:bg-muted"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
                    Refresh Board
                </Button>
            </div>

            {/* Premium Dynamic Resizable Layout Panel Group */}
            <div className="flex-1 min-h-0 overflow-hidden relative flex flex-row w-full">
                <ResizablePanelGroup direction="horizontal" className="h-full w-full items-stretch">
                    {/* 1. Sidebar list of all routes */}
                    <ResizablePanel defaultSize={20} minSize={10}>
                        <RouteList
                            routes={routesData?.data ?? []}
                            total={routesData?.total ?? 0}
                            selectedRouteId={selectedRouteId}
                            onSelectRoute={setSelectedRouteId}
                            onCreateRoute={(data) => createMutation.mutate(data)}
                            isCreating={createMutation.isPending}
                        />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* 2. Interactive geospatial map */}
                    <ResizablePanel defaultSize={50} minSize={20}>
                        <DispatchMap
                            mapViewport={mapViewport}
                            setMapViewport={setMapViewport}
                            unassignedDeliveries={unassignedData?.data ?? []}
                            activeRoute={activeRoute ?? null}
                            onPinClick={handlePinClick}
                        />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* 3. Right control sequence panel */}
                    <ResizablePanel defaultSize={30} minSize={15}>
                        <RoutePanel
                            activeRoute={activeRoute ?? null}
                            isLoading={routeLoading}
                            drivers={driversData?.data ?? []}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            onAssignDriver={handleAssignDriver}
                            onOptimize={(id) => optimizeMutation.mutate(id)}
                            onPublish={(id) => publishMutation.mutate(id)}
                            onRemoveStop={(stopId) => removeStopMutation.mutate({ routeId: selectedRouteId!, stopId })}
                            onReorder={(orderedDeliveryIds) => reorderMutation.mutate({ routeId: selectedRouteId!, orderedDeliveryIds })}
                            isOptimizePending={optimizeMutation.isPending}
                            isPublishPending={publishMutation.isPending}
                            isDeletePending={deleteMutation.isPending}
                            isRemoveStopPending={removeStopMutation.isPending}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
};

export default DispatchPage;
