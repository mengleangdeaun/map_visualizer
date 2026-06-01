import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocationService } from '../../hooks/useLocationService';
import { useTelemetry, formatDuration } from '../../hooks/useTelemetry';
import { StatCard } from './components/StatCard';
import { ShiftControl } from './components/ShiftControl';
import { TelemetryBar } from './components/TelemetryBar';
import { Button } from '@/components/ui/button';
import { Navigation, AlertCircle, Route, Clock } from 'lucide-react';
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
    const { isTracking, startTracking, stopTracking, error, requestCompassPermission } = useLocationService();

    // Rich telemetry: live GPS + server shift stats
    const { live, compass, accuracy, stats } = useTelemetry();

    // Shift Check-in / Checkout states & hooks
    const { data: activeShiftData, isLoading: isActiveShiftLoading, refetch: refetchActiveShift } = useActiveShift();
    const { data: vehiclesData = [], isLoading: isVehiclesLoading } = useCompanyVehicles();
    const checkInMutation = useCheckInVehicle();
    const checkOutMutation = useCheckOutVehicle();

    const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

    const activeVehicle = activeShiftData?.vehicle || null;

    const handleRefresh = async () => {
        await refetchActiveShift();
    };

    const handleStartShift = async () => {
        await requestCompassPermission();
        if (activeVehicle) {
            startTracking();
        } else {
            setIsVehicleDialogOpen(true);
        }
    };

    const handleStopShift = () => {
        checkOutMutation.mutate(undefined, {
            onSuccess: () => {
                stopTracking();
            }
        });
    };

    const handleSelectVehicle = async (vehicleId: string) => {
        await requestCompassPermission();
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
                />

                {/* Stats Grid */}
                <div>
                    {!isTracking ? (
                        <div className="flex flex-col gap-4">
                            <StatCard
                                label={t('speed') || "Speed"}
                                value={0}
                                unit="km/h"
                                icon={Navigation}
                                colorClassName="text-muted-foreground"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                label={t('est_distance') || "Distance"}
                                value={(stats?.distanceKm ?? 0).toFixed(1)}
                                unit="km"
                                icon={Route}
                                colorClassName="text-violet-500"
                            />
                            <StatCard
                                label={t('top_speed') || "Top Speed"}
                                value={stats?.maxSpeedKmh ?? 0}
                                unit="km/h"
                                icon={Navigation}
                                colorClassName="text-rose-500"
                            />
                            <StatCard
                                label={t('shift_duration') || "Shift Duration"}
                                value={stats ? formatDuration(stats.durationSeconds) : '0s'}
                                icon={Clock}
                                className="col-span-2"
                                colorClassName="text-amber-500"
                            />
                        </div>
                    )}
                </div>

                {/* Tracking Error */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                        <Button
                            size="sm"
                            variant="link"
                            className="h-auto p-0 text-xs font-black uppercase tracking-wider text-destructive hover:text-destructive/80 active:scale-[0.97] transition-transform duration-100"
                            onClick={() => startTracking()}
                        >
                            {t('retry') || 'Retry'}
                        </Button>
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
