import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVehicles } from '@/domains/admin/hooks/useVehicles';
import { useTasks } from '@/domains/admin/pages/Tasks/hooks/useTasks';
import { useAdminHubs } from '@/domains/admin/pages/Hub/hooks/useAdminHubs';
import { MonitoringMap } from '@/domains/admin/pages/Monitoring/components/MonitoringMap';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { Card } from '@/components/ui/card';
import { TaskPanel } from './components/TaskPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { echo } from '@/lib/echo';
import TaskDialog from '@/domains/admin/pages/Tasks/components/TaskDialog';
import { MousePointer2, Plus, X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MonitoringPage = () => {
    const { t } = useTranslation(['admin', 'system']);
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [focusTarget, setFocusTarget] = React.useState<{ id: string; type: 'vehicle' | 'hub' | 'task'; center: [number, number] } | null>(null);

    // Task Creation State
    const [pendingPickup, setPendingPickup] = React.useState<{ lat: number, lng: number } | null>(null);
    const [pendingDropoff, setPendingDropoff] = React.useState<{ lat: number, lng: number } | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [selectionMode, setSelectionMode] = React.useState<'none' | 'pickup' | 'dropoff'>('none');

    const handleFocusTarget = React.useCallback((target: { id: string; type: 'vehicle' | 'hub' | 'task'; center: [number, number] }) => {
        setFocusTarget({ ...target });
    }, []);

    const handleMapClick = React.useCallback((e: any) => {
        if (selectionMode === 'none') return;

        const { lng, lat } = e.lngLat;
        if (selectionMode === 'pickup') {
            setPendingPickup({ lat, lng });
            setSelectionMode('dropoff');
        } else if (selectionMode === 'dropoff') {
            setPendingDropoff({ lat, lng });
        }
    }, [selectionMode]);

    const resetSelection = () => {
        setPendingPickup(null);
        setPendingDropoff(null);
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

    const handleRefresh = React.useCallback(() => {
        refetchHubs();
        refetchVehicles();
        refetchTasks();
        // Force refresh for any task queries (like the one in TaskPanel)
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }, [refetchHubs, refetchVehicles, refetchTasks, queryClient]);

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
            const channelName = `fleet.${id}`;
            activeChannelNames.push(channelName);
            console.log('MonitoringPage: Subscribing to company channel', channelName);
            
            echo.private(channelName)
                .listen('.task.updated', (e: any) => {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
                    isFetching: isHubsFetching || isVehiclesFetching
                }}
            />

            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 gap-4">
                <ResizablePanel defaultSize={75} minSize={30}>
                    <div className="h-full rounded-2xl overflow-hidden border bg-card shadow-sm relative">
                        <MonitoringMap 
                            locations={hubsData?.data || []}
                            vehicles={vehiclesData?.data || []}
                            tasks={tasksData?.data || []}
                            isLoading={isHubsLoading || isVehiclesLoading || isTasksLoading}
                            isFetching={isHubsFetching || isVehiclesFetching || isTasksFetching}
                            focusTarget={focusTarget}
                            onClick={handleMapClick}
                            pendingPickup={pendingPickup}
                            pendingDropoff={pendingDropoff}
                            onCreateTask={() => setIsCreateDialogOpen(true)}
                        />

                        {/* Interactive Selection Overlays */}
                        {selectionMode !== 'none' && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30">
                                <div className="bg-background/90 backdrop-blur-md px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 ring-1 ring-primary/20">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        {selectionMode === 'pickup' ? <MousePointer2 className="size-4 text-primary" /> : <Flag className="size-4 text-destructive" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">
                                            {selectionMode === 'pickup' ? t('admin:click_to_set_pickup') || 'Click to set Pickup' : t('admin:click_to_set_dropoff') || 'Click to set Destination'}
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
                        {selectionMode === 'none' && !pendingPickup && (
                            <Button 
                                variant="secondary"
                                className="absolute top-3 py-4 px-3 right-14 z-30 bg-background/80 backdrop-blur-md hover:bg-primary hover:text-white transition-all overflow-hidden"
                                onClick={() => setSelectionMode('pickup')}
                            >
                                <Plus className="size-4" />
                                {t('admin:create_by_map') || 'Create by Map'}
                            </Button>
                        )}
                    </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle  />

                <ResizablePanel defaultSize={25} minSize={20} className="min-w-[320px]">
                    <div className="h-full flex flex-col rounded-2xl overflow-hidden border bg-card shadow-sm relative">
                        <TaskPanel onFocusTarget={handleFocusTarget} />
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
        </div>
    );
};

export default MonitoringPage;
