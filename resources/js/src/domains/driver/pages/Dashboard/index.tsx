import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocationService } from '../../hooks/useLocationService';
import { StatCard } from '../../components/StatCard';
import { ShiftControl } from '../../components/ShiftControl';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Navigation, AlertCircle, Map as MapIcon, Activity, Truck, ChevronRight } from 'lucide-react';
import { useDriverTasks } from '../../hooks/useDriverTasks';
import { Link } from '@tanstack/react-router';
import { 
    useActiveShift, 
    useCompanyVehicles, 
    useCheckInVehicle, 
    useCheckOutVehicle 
} from '../../hooks/useDriverShift';
import { VehicleSelectDialog } from './components/VehicleSelectDialog';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';

const DriverDashboard = () => {
    const { t } = useTranslation(['driver', 'system']);
    const { isTracking, startTracking, stopTracking, latitude, longitude, error, speed } = useLocationService();
    
    // Shift Check-in / Checkout states & hooks
    const { data: activeShiftData, isLoading: isActiveShiftLoading, refetch: refetchActiveShift } = useActiveShift();
    const { data: vehiclesData = [], isLoading: isVehiclesLoading } = useCompanyVehicles();
    const checkInMutation = useCheckInVehicle();
    const checkOutMutation = useCheckOutVehicle();

    const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

    const activeVehicle = activeShiftData?.vehicle || null;

    // Task query
    const { data: tasksData, refetch: refetchTasks } = useDriverTasks();
    const tasks = tasksData?.data || [];
    const activeTask = tasks.find(t => t.status === 'in_progress');

    const handleRefresh = async () => {
        await Promise.all([
            refetchActiveShift(),
            refetchTasks()
        ]);
    };

    // Auto-resume tracking if shift is active in DB but frontend tracking is off on mount
    useEffect(() => {
        if (activeVehicle && !isTracking && !error) {
            // Optional auto-start tracking if they already have an active checked-in vehicle
            startTracking();
        }
    }, [activeVehicle, startTracking]);

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
            <div className="p-4 flex flex-col gap-6 max-w-md mx-auto animate-in fade-in duration-500">
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
                    value={speed ? Math.round(speed * 3.6) : 0} 
                    unit="km/h"
                    icon={Navigation} 
                    colorClassName="text-blue-500"
                />
            </div>

            {/* Tasks Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {t('upcoming_deliveries') || "Upcoming Deliveries"}
                    </span>
                    <Link to="/driver/tasks" className="text-[10px] font-bold text-primary hover:underline uppercase">
                        {t('view_all') || "View All"}
                    </Link>
                </div>
                
                {tasks.length === 0 ? (
                    <Card className="p-4 bg-background/50 border-dashed border-2 flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                        <MapIcon size={32} className="opacity-20" />
                        <span className="text-xs font-medium italic">
                            {t('no_active_tasks') || "No active tasks assigned yet."}
                        </span>
                    </Card>
                ) : (
                    <Link to="/driver/tasks">
                        <Card className="p-4 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <Truck size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black tracking-tight">{tasks[0].title}</span>
                                        {tasks[0].priority && (
                                            <span className={cn(
                                                "text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 origin-left shrink-0",
                                                tasks[0].priority === 'urgent' && "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse",
                                                tasks[0].priority === 'high' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                                                tasks[0].priority === 'normal' && "bg-slate-500/10 text-slate-600 border border-slate-500/20",
                                                tasks[0].priority === 'low' && "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                            )}>
                                                {t(`admin:${tasks[0].priority}`) || tasks[0].priority}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                                        {tasks[0].status} • {tasks[0].contact_name}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                        </Card>
                    </Link>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Debug Coordinates */}
            {latitude && longitude && (
                <div className="mt-auto text-center opacity-30">
                    <span className="text-[9px] font-mono">
                        GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
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
