import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocationService } from '../../hooks/useLocationService';
import { useTelemetry } from '../../hooks/useTelemetry';
import { StatCard } from './components/StatCard';
import { ShiftControl } from './components/ShiftControl';
import { TelemetryBar } from './components/TelemetryBar';
import { TasksSection } from './components/TasksSection';
import { Navigation, AlertCircle, Activity, BarChart2 } from 'lucide-react';
import { useDriverTasks } from '../../hooks/useDriverTasks';
import {
    useActiveShift,
    useCompanyVehicles,
    useCheckInVehicle,
    useCheckOutVehicle,
} from '../../hooks/useDriverShift';
import { VehicleSelectDialog } from './components/VehicleSelectDialog';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';

const DriverDashboard = () => {
    const { t } = useTranslation();

    // Location + tracking control
    const { isTracking, startTracking, stopTracking, error } = useLocationService();

    // Rich telemetry: live GPS + server shift stats
    const { live, compass, accuracy, stats } = useTelemetry();

    // Shift Check-in / Checkout states & hooks
    const { data: activeShiftData, isLoading: isActiveShiftLoading, refetch: refetchActiveShift } = useActiveShift();
    const { data: vehiclesData = [], isLoading: isVehiclesLoading } = useCompanyVehicles();
    const checkInMutation = useCheckInVehicle();
    const checkOutMutation = useCheckOutVehicle();

    const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

    const activeVehicle = activeShiftData?.vehicle || null;

    // Task query
    const { data: tasksData, isLoading: isTasksLoading, refetch: refetchTasks } = useDriverTasks();
    const tasks = tasksData?.data || [];
    const activeTask = tasks.find(t => t.status === 'in_progress');

    const handleRefresh = async () => {
        await Promise.all([
            refetchActiveShift(),
            refetchTasks(),
        ]);
    };

    const handleStartShift = () => {
        if (activeVehicle) {
            startTracking();
        } else {
            setIsVehicleDialogOpen(true);
        }
    };

    const handleStopShift = () => {
        stopTracking();
    };

    const handleSelectVehicle = (vehicleId: string) => {
        checkInMutation.mutate(vehicleId, {
            onSuccess: () => {
                setIsVehicleDialogOpen(false);
                startTracking();
            }
        });
    };

    const handleCheckOut = () => {
        checkOutMutation.mutate(undefined, {
            onSuccess: () => {
                stopTracking();
            }
        });
    };

    const isOperationLoading = isActiveShiftLoading || checkInMutation.isPending || checkOutMutation.isPending;

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="p-4 flex flex-col gap-5 max-w-md mx-auto animate-in fade-in duration-500">

                {/* Main Shift Control */}
                <ShiftControl
                    isOnline={isTracking}
                    activeVehicle={activeVehicle}
                    onStartTracking={handleStartShift}
                    onStopTracking={handleStopShift}
                    onSelectVehicle={() => setIsVehicleDialogOpen(true)}
                    onCheckOut={handleCheckOut}
                    isLoading={isOperationLoading}
                />

                {/* Live Telemetry Strip — visible only when broadcasting */}
                <TelemetryBar
                    isTracking={isTracking}
                    speedKmh={live?.speedKmh ?? 0}
                    compass={compass}
                    accuracy={accuracy}
                    stats={stats}
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        label={t('active_task') || "Active Task"}
                        value={activeTask ? '1' : 'None'}
                        icon={Activity}
                        colorClassName={activeTask ? "text-primary" : "text-muted-foreground"}
                    />
                    <StatCard
                        label={t('speed') || "Speed"}
                        value={live?.speedKmh ?? 0}
                        unit="km/h"
                        icon={Navigation}
                        colorClassName="text-blue-500"
                    />
                </div>

                {/* Shift Stats Cards — shown when server data is available */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <StatCard
                            label="Distance"
                            value={(stats.distanceKm ?? 0).toFixed(1)}
                            unit="km"
                            icon={BarChart2}
                            colorClassName="text-violet-500"
                        />
                        <StatCard
                            label="Top Speed"
                            value={stats.maxSpeedKmh}
                            unit="km/h"
                            icon={Navigation}
                            colorClassName="text-rose-500"
                        />
                    </div>
                )}

                {/* Tasks Section */}
                <TasksSection tasks={tasks} isLoading={isTasksLoading} />

                {/* Tracking Error */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Debug GPS Coordinates (very subtle) */}
                {live && (
                    <div className="mt-auto text-center opacity-30">
                        <span className="text-[9px] font-mono">
                            GPS: {live.latitude.toFixed(6)}, {live.longitude.toFixed(6)}
                        </span>
                    </div>
                )}

                {/* Vehicle Selection Dialog */}
                <VehicleSelectDialog
                    isOpen={isVehicleDialogOpen}
                    onClose={() => setIsVehicleDialogOpen(false)}
                    vehicles={vehiclesData}
                    onSelect={handleSelectVehicle}
                    isLoading={isOperationLoading || isVehiclesLoading}
                />
            </div>
        </PullToRefresh>
    );
};

export default DriverDashboard;
