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

const MonitoringPage = () => {
    const { t } = useTranslation(['admin', 'system']);
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [focusTarget, setFocusTarget] = React.useState<{ id: string; type: 'vehicle' | 'hub' | 'task'; center: [number, number] } | null>(null);

    const handleFocusTarget = React.useCallback((target: { id: string; type: 'vehicle' | 'hub' | 'task'; center: [number, number] }) => {
        setFocusTarget({ ...target });
    }, []);

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

        if (companyIds.size === 0) return;

        const activeChannelNames: string[] = [];

        companyIds.forEach(id => {
            const channelName = `fleet.${id}`;
            activeChannelNames.push(channelName);
            
            echo.private(channelName)
                .listen('.vehicle.location.updated', (e: any) => {
                    queryClient.invalidateQueries({ queryKey: ['admin', 'vehicles'] });
                })
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
                        />
                    </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle  />

                <ResizablePanel defaultSize={25} minSize={20} className="min-w-[320px]">
                    <div className="h-full flex flex-col rounded-2xl overflow-hidden border bg-card shadow-sm relative">
                        <TaskPanel onFocusTarget={handleFocusTarget} />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default MonitoringPage;
