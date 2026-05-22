import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVehicles } from '@/domains/admin/hooks/useVehicles';
import { useTasks } from '@/domains/admin/pages/Tasks/hooks/useTasks';
import { useAdminHubs } from '@/domains/admin/pages/Hub/hooks/useAdminHubs';
import { useDeliveries } from '@/domains/admin/pages/Delivery/hooks/useDeliveries';
import { MonitoringMap } from '@/domains/admin/pages/Monitoring/components/MonitoringMap';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { Card } from '@/components/ui/card';
import { TaskPanel } from './components/TaskPanel';
import { DeliveryPanel } from './components/DeliveryPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { echo } from '@/lib/echo';
import api from '@/lib/api';
import { toast } from 'sonner';
import TaskDialog from '@/domains/admin/pages/Tasks/components/TaskDialog';
import DeliveryDialog from '@/domains/admin/pages/Delivery/components/DeliveryDialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MousePointer2, Plus, X, Flag, ClipboardList, Package, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MonitoringPage = () => {
    const { t } = useTranslation(['admin']);
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [focusTarget, setFocusTarget] = React.useState<{ id: string; type: 'vehicle' | 'hub' | 'task' | 'delivery'; center: [number, number] } | null>(null);

    // Interactive Creation State
    const [pendingPickup, setPendingPickup] = React.useState<{ lat: number, lng: number } | null>(null);
    const [pendingDropoff, setPendingDropoff] = React.useState<{ lat: number, lng: number } | null>(null);
    const [pendingDeliveryDropoff, setPendingDeliveryDropoff] = React.useState<{ lat: number, lng: number } | null>(null);
    const [pendingRoadAlert, setPendingRoadAlert] = React.useState<{ lat: number, lng: number } | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [isDeliveryCreateDialogOpen, setIsDeliveryCreateDialogOpen] = React.useState(false);
    const [selectionMode, setSelectionMode] = React.useState<'none' | 'task_pickup' | 'task_dropoff' | 'delivery_dropoff' | 'road_alert'>('none');

    const handleFocusTarget = React.useCallback((target: { id: string; type: 'vehicle' | 'hub' | 'task' | 'delivery'; center: [number, number] }) => {
        setFocusTarget({ ...target });
    }, []);

    const handleMapClick = React.useCallback((e: any) => {
        if (selectionMode === 'none') return;

        const { lng, lat } = e.lngLat;
        if (selectionMode === 'task_pickup') {
            setPendingPickup({ lat, lng });
            setSelectionMode('task_dropoff');
        } else if (selectionMode === 'task_dropoff') {
            setPendingDropoff({ lat, lng });
        } else if (selectionMode === 'delivery_dropoff') {
            setPendingDeliveryDropoff({ lat, lng });
        } else if (selectionMode === 'road_alert') {
            setPendingRoadAlert({ lat, lng });
        }
    }, [selectionMode]);

    const resetSelection = () => {
        setPendingPickup(null);
        setPendingDropoff(null);
        setPendingDeliveryDropoff(null);
        setPendingRoadAlert(null);
        setSelectionMode('none');
    };

    // Fetch Hubs (All for map)
    const { 
        data: hubsData, 
        isLoading: isHubsLoading, 
        isFetching: isHubsFetching,
        refetch: refetchHubs
    } = useAdminHubs({ per_page: 100 });

    // Fetch Vehicles (All for map)
    const { 
        data: vehiclesData, 
        isLoading: isVehiclesLoading, 
        isFetching: isVehiclesFetching,
        refetch: refetchVehicles
    } = useVehicles({ per_page: 100 });

    // Fetch Tasks (Active for map)
    const {
        data: tasksData,
        isLoading: isTasksLoading,
        isFetching: isTasksFetching,
        refetch: refetchTasks
    } = useTasks({ per_page: 100, status: 'active' });

    // Fetch Deliveries (All for map, filtered locally for active)
    const {
        data: deliveriesData,
        isLoading: isDeliveriesLoading,
        isFetching: isDeliveriesFetching,
        refetch: refetchDeliveries
    } = useDeliveries({ per_page: 100 });

    // Filter active deliveries (excluding delivered and failed)
    const activeDeliveries = useMemo(() => {
        if (!deliveriesData?.data) return [];
        return deliveriesData.data.filter((d: any) => d.status !== 'delivered' && d.status !== 'failed');
    }, [deliveriesData]);

    // Fetch Geospatial Roadblocks/Road Alerts
    const {
        data: roadblocksData,
        isLoading: isRoadblocksLoading,
        isFetching: isRoadblocksFetching,
        refetch: refetchRoadblocks
    } = useQuery({
        queryKey: ['admin', 'road-alerts'],
        queryFn: async () => {
            const { data } = await api.get('/admin/road-alerts');
            return data.data;
        }
    });

    // Resolve Roadblock Mutation (Delete)
    const resolveRoadblockMutation = useMutation({
        mutationFn: async (id: string | number) => {
            await api.delete(`/admin/road-alerts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'road-alerts'] });
            toast.success("Roadblock resolved successfully.");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to resolve roadblock.");
        }
    });

    const handleRefresh = React.useCallback(() => {
        refetchHubs();
        refetchVehicles();
        refetchTasks();
        refetchDeliveries();
        refetchRoadblocks();
        // Force refresh for any task/delivery/road-alert queries
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'road-alerts'] });
    }, [refetchHubs, refetchVehicles, refetchTasks, refetchDeliveries, refetchRoadblocks, queryClient]);

    // Real-time synchronization
    useEffect(() => {
        if (!user) return;

        const companyIds = new Set<string>();
        
        // 1. Always listen to the user's primary company
        if (user.company_id) {
            companyIds.add(user.company_id);
        }
        
        // 2. For super admins, also listen to companies of visible fleet
        if (user.role === 'super_admin' || user.role === 'admin') {
            vehiclesData?.data.forEach((v: any) => {
                if (v.company_id) companyIds.add(v.company_id);
            });
            tasksData?.data.forEach((t: any) => {
                if (t.company_id) companyIds.add(t.company_id);
            });
        }

        if (companyIds.size === 0) {
            console.warn('MonitoringPage: No company IDs found to listen to');
            return;
        }

        const activeChannelNames: string[] = [];

        companyIds.forEach(id => {
            const fleetChannel = `fleet.${id}`;
            activeChannelNames.push(fleetChannel);
            console.log('MonitoringPage: Subscribing to company fleet channel', fleetChannel);
            
            echo.private(fleetChannel)
                .listen('.task.updated', (e: any) => {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] });
                });

            const companyChannel = `company.${id}`;
            activeChannelNames.push(companyChannel);
            console.log('MonitoringPage: Subscribing to company events channel', companyChannel);

            echo.private(companyChannel)
                .listen('.road-alert.created', (e: any) => {
                    queryClient.invalidateQueries({ queryKey: ['admin', 'road-alerts'] });
                })
                .listen('.road-alert.deleted', (e: any) => {
                    queryClient.invalidateQueries({ queryKey: ['admin', 'road-alerts'] });
                });
        });

        return () => {
            activeChannelNames.forEach(name => echo.leave(name));
        };
    }, [user?.id, user?.company_id, vehiclesData?.data?.length, tasksData?.data?.length, queryClient]);

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <PageHeader
                title={t('admin:monitoring_dashboard') || 'Monitoring Dashboard'}
                subtitle={t('admin:realtime_fleet_overview') || 'Real-time overview of your fleet and infrastructure'}
                refreshAction={{
                    onClick: handleRefresh,
                    isFetching: isHubsFetching || isVehiclesFetching || isTasksFetching || isDeliveriesFetching
                }}
            />

            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 gap-4">
                <ResizablePanel defaultSize={75} minSize={30}>
                    <div className="h-full rounded-2xl overflow-hidden border bg-card shadow-sm relative">
                        <MonitoringMap 
                            locations={hubsData?.data || []}
                            vehicles={vehiclesData?.data || []}
                            tasks={tasksData?.data || []}
                            deliveries={activeDeliveries}
                            roadblocks={roadblocksData || []}
                            pendingRoadAlert={pendingRoadAlert}
                            onResolveRoadblock={resolveRoadblockMutation.mutate}
                            isLoading={isHubsLoading || isVehiclesLoading || isTasksLoading || isDeliveriesLoading || isRoadblocksLoading}
                            isFetching={isHubsFetching || isVehiclesFetching || isTasksFetching || isDeliveriesFetching || isRoadblocksFetching}
                            focusTarget={focusTarget}
                            onClick={handleMapClick}
                            pendingPickup={pendingPickup}
                            pendingDropoff={pendingDropoff}
                            pendingDeliveryDropoff={pendingDeliveryDropoff}
                            onCreateTask={() => setIsCreateDialogOpen(true)}
                            onCreateDelivery={() => setIsDeliveryCreateDialogOpen(true)}
                            onResetSelection={resetSelection}
                        />

                        {/* Interactive Selection Overlays */}
                        {selectionMode !== 'none' && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30">
                                <div className="bg-background/90 backdrop-blur-md px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 ring-1 ring-primary/20">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        {selectionMode === 'task_pickup' ? (
                                            <MapPin className="size-4 text-emerald-500" />
                                        ) : selectionMode === 'task_dropoff' ? (
                                            <Flag className="size-4 text-red-500" />
                                        ) : selectionMode === 'delivery_dropoff' ? (
                                            <Package className="size-4 text-indigo-500" />
                                        ) : (
                                            <AlertTriangle className="size-4 text-red-500 animate-bounce" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">
                                            {selectionMode === 'task_pickup' 
                                                ? t('admin:click_to_set_pickup') || 'Click to set Pickup' 
                                                : selectionMode === 'task_dropoff' 
                                                ? t('admin:click_to_set_dropoff') || 'Click to set Destination' 
                                                : selectionMode === 'delivery_dropoff'
                                                ? t('admin:click_to_set_delivery_destination') || 'Click on map to set Destination'
                                                : 'Click on map to place Road Block warning'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Interactive Mode</span>
                                    </div>
                                    <Button size="icon-sm" variant="ghost" onClick={resetSelection} className="ml-2 hover:bg-destructive/10 hover:text-destructive">
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>
                        )}


                        {/* Quick Action Button to Start Selection */}
                        {selectionMode === 'none' && !pendingPickup && !pendingDeliveryDropoff && !pendingRoadAlert && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="secondary"
                                        className="absolute top-3 py-4 px-3 right-14 z-30 bg-background/80 backdrop-blur-md hover:bg-primary hover:text-white transition-all overflow-hidden"
                                    >
                                        <Plus className="size-4 mr-1" />
                                        {t('admin:create_by_map') || 'Create by Map'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 mt-1 z-[40]">
                                 <DropdownMenuItem 
                                        onClick={() => setSelectionMode('delivery_dropoff')}
                                        className="cursor-pointer flex items-center gap-2"
                                    >
                                        <Package className="size-4 text-indigo-500" />
                                        <span>{t('admin:create_delivery_by_map') || 'Create Delivery by Map'}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => setSelectionMode('task_pickup')}
                                        className="cursor-pointer flex items-center gap-2"
                                    >
                                        <ClipboardList className="size-4 text-emerald-500" />
                                        <span>{t('admin:create_task_by_map') || 'Create Task by Map'}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => setSelectionMode('road_alert')}
                                        className="cursor-pointer flex items-center gap-2"
                                    >
                                        <AlertTriangle className="size-4 text-red-500" />
                                        <span>Report Road Block</span>
                                    </DropdownMenuItem>

                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle  />

                <ResizablePanel defaultSize={25} minSize={20} className="min-w-[320px]">
                    <div className="h-full flex flex-col rounded-2xl overflow-hidden border bg-card shadow-sm relative">
                        <Tabs defaultValue="deliveries" className="flex flex-col h-full">
                            <div className="p-4 pb-2 border-b bg-card">
                                <TabsList className="grid w-full grid-cols-2 p-1 rounded-xl">
                                    <TabsTrigger value="deliveries" className="rounded-lg py-2 font-semibold text-xs transition-all gap-2">
                                        <Package className="size-3.5" />
                                        <span>{t('admin:deliveries') || 'Deliveries'}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="tasks" className="rounded-lg py-2 font-semibold text-xs transition-all gap-2">
                                        <ClipboardList className="size-3.5" />
                                        <span>{t('admin:tasks') || 'Tasks'}</span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <TabsContent value="tasks" className="flex-1 min-h-0 pt-3">
                                <TaskPanel onFocusTarget={handleFocusTarget} />
                            </TabsContent>
                            
                            <TabsContent value="deliveries" className="flex-1 min-h-0 pt-3">
                                <DeliveryPanel onFocusTarget={handleFocusTarget} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
            <TaskDialog 
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) resetSelection();
                }}
                initialValues={{
                    pickup_lat: pendingPickup?.lat,
                    pickup_lng: pendingPickup?.lng,
                    dropoff_lat: pendingDropoff?.lat,
                    dropoff_lng: pendingDropoff?.lng,
                    pickup_address: pendingPickup ? `${pendingPickup.lat.toFixed(6)}, ${pendingPickup.lng.toFixed(6)}` : '',
                    dropoff_address: pendingDropoff ? `${pendingDropoff.lat.toFixed(6)}, ${pendingDropoff.lng.toFixed(6)}` : '',
                }}
            />
            <DeliveryDialog 
                open={isDeliveryCreateDialogOpen}
                onOpenChange={(open) => {
                    setIsDeliveryCreateDialogOpen(open);
                    if (!open) resetSelection();
                }}
                initialValues={{
                    dropoff_latitude: pendingDeliveryDropoff?.lat,
                    dropoff_longitude: pendingDeliveryDropoff?.lng,
                    dropoff_address: pendingDeliveryDropoff ? `${pendingDeliveryDropoff.lat.toFixed(6)}, ${pendingDeliveryDropoff.lng.toFixed(6)}` : '',
                }}
            />
        </div>
    );
};

export default MonitoringPage;
